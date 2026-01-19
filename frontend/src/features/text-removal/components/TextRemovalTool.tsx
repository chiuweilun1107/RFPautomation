'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Loader2, Download, AlertCircle } from 'lucide-react';
import { CanvasBboxMarkup } from './CanvasBboxMarkup';
import { textRemovalApi } from '../api/textRemovalApi';
import type { BBox, TextRemovalMode, InpaintModel, ProcessingState } from '../types';
import { toast } from 'sonner';

const MODES = [
  {
    id: 'manual' as TextRemovalMode,
    label: '手動標記',
    description: '在圖片上手動標記需要清除的文字區域',
  },
  {
    id: 'vision' as TextRemovalMode,
    label: 'AI 自動偵測',
    description: '使用 Vision AI 自動偵測文字位置',
  },
  {
    id: 'auto' as TextRemovalMode,
    label: '智能全圖清除',
    description: '全圖分析並智能清除所有文字',
  },
];

const MODELS = [
  { id: 'sd15' as InpaintModel, label: 'SD 1.5 (最高品質，速度較慢)', emoji: '⭐' },
  { id: 'lama' as InpaintModel, label: 'LaMa (最快)', emoji: '⚡' },
  { id: 'mat' as InpaintModel, label: 'MAT (平衡)', emoji: '⚙️' },
];

export const TextRemovalTool: React.FC = () => {
  const [imageBase64, setImageBase64] = useState<string>('');
  const [mode, setMode] = useState<TextRemovalMode>('manual');
  const [model, setModel] = useState<InpaintModel>('sd15');
  const [bboxes, setBboxes] = useState<BBox[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({
    isLoading: false,
    progress: 0,
    error: null,
  });
  const [resultImage, setResultImage] = useState<string>('');
  const [processingInfo, setProcessingInfo] = useState<any>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      if (!file.type.startsWith('image/')) {
        toast.error('請選擇有效的圖片檔案');
        return;
      }

      const base64 = await textRemovalApi.fileToBase64(file);
      setImageBase64(base64);
      setBboxes([]);
      setResultImage('');
      setProcessingInfo(null);
      toast.success('圖片已上傳');
    } catch (error) {
      toast.error('圖片上傳失敗');
      console.error(error);
    }
  }, []);

  const handleDragDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  const handleProcessImage = useCallback(async () => {
    try {
      if (!imageBase64) {
        toast.error('請先上傳圖片');
        return;
      }

      if (mode === 'manual' && bboxes.length === 0) {
        toast.error('請標記至少一個文字區域');
        return;
      }

      setProcessing({
        isLoading: true,
        progress: 0,
        error: null,
      });

      // Convert bboxes to n8n format: [ymin, xmin, ymax, xmax]
      const formattedBboxes = bboxes.map((bbox) => [
        Math.round(bbox.y),
        Math.round(bbox.x),
        Math.round(bbox.y + bbox.height),
        Math.round(bbox.x + bbox.width),
      ]) as Array<[number, number, number, number]>;

      const response = await textRemovalApi.removeText({
        mode,
        image_base64: imageBase64,
        bboxes: mode === 'manual' ? formattedBboxes : undefined,
        model,
      });

      if (response.status === 'error') {
        throw new Error(response.error || 'Unknown error');
      }

      setResultImage(response.image_base64 || '');
      setProcessingInfo({
        model: response.model,
        processingTime: response.processing_time_ms,
        mode: response.mode,
      });

      toast.success('圖片處理完成');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '處理失敗';
      setProcessing({
        isLoading: false,
        progress: 0,
        error: errorMsg,
      });
      toast.error(errorMsg);
    } finally {
      setProcessing((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [imageBase64, mode, bboxes, model]);

  const handleDownloadResult = useCallback(() => {
    if (resultImage) {
      textRemovalApi.downloadImage(resultImage, 'text-removal-result.png');
      toast.success('圖片已下載');
    }
  }, [resultImage]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-serif font-bold text-[#00063D] dark:text-white">
          文字清除工具
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          使用 AI 智能清除圖片中的文字，支援三種清除模式
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mode Selection */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-lg">🎯</span>清除模式
            </h2>
            <div className="space-y-3">
              {MODES.map((m) => (
                <label
                  key={m.id}
                  className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition"
                  style={{
                    borderColor: mode === m.id ? '#3b82f6' : '#e5e7eb',
                    backgroundColor:
                      mode === m.id
                        ? '#eff6ff'
                        : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={m.id}
                    checked={mode === m.id}
                    onChange={(e) => setMode(e.target.value as TextRemovalMode)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{m.label}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{m.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-lg">🤖</span>清除模型
            </h2>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as InpaintModel)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.emoji} {m.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              根據所需的速度和品質選擇模型
            </p>
          </div>

          {/* Processing Info */}
          {processingInfo && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 space-y-2">
              <h3 className="font-semibold text-blue-900 dark:text-blue-400 flex items-center gap-2">
                <span>ℹ️</span>處理信息
              </h3>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                <p>模型: {processingInfo.model}</p>
                {processingInfo.processingTime && (
                  <p>耗時: {processingInfo.processingTime}ms</p>
                )}
                <p>模式: {processingInfo.mode}</p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {processing.error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4 space-y-2">
              <h3 className="font-semibold text-red-900 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                錯誤
              </h3>
              <p className="text-sm text-red-800 dark:text-red-300">{processing.error}</p>
            </div>
          )}
        </div>

        {/* Right Panel - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Upload Area */}
          {!imageBase64 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDragDrop}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center space-y-4 bg-gray-50 dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer"
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  拖動圖片到此處或點擊選擇
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">支持 PNG、JPG、WebP 等格式</p>
              </div>
              <label className="inline-block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                  className="hidden"
                />
                <span className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                  選擇圖片
                </span>
              </label>
            </div>
          ) : (
            <>
              {/* Canvas for Manual Mode */}
              {mode === 'manual' && (
                <CanvasBboxMarkup
                  imageBase64={imageBase64}
                  bboxes={bboxes}
                  onBboxesChange={setBboxes}
                />
              )}

              {/* Image Preview for Other Modes */}
              {mode !== 'manual' && (
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                  <img
                    src={`data:image/png;base64,${imageBase64}`}
                    alt="上傳的圖片"
                    className="w-full rounded-lg max-h-96 object-contain"
                  />
                </div>
              )}

              {/* Change Image Button */}
              <label className="inline-block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                  className="hidden"
                />
                <span className="inline-block px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer">
                  更換圖片
                </span>
              </label>
            </>
          )}

          {/* Result Display */}
          {resultImage && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4 space-y-4">
              <h3 className="font-semibold text-green-900 dark:text-green-400">
                ✓ 處理完成
              </h3>
              <img
                src={`data:image/png;base64,${resultImage}`}
                alt="處理結果"
                className="w-full rounded-lg max-h-96 object-contain"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadResult}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  <Download className="w-4 h-4" />
                  下載結果
                </button>
                <button
                  onClick={() => {
                    setImageBase64('');
                    setBboxes([]);
                    setResultImage('');
                    setProcessingInfo(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  處理新圖片
                </button>
              </div>
            </div>
          )}

          {/* Process Button */}
          {imageBase64 && !resultImage && (
            <button
              onClick={handleProcessImage}
              disabled={processing.isLoading || (mode === 'manual' && bboxes.length === 0)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {processing.isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  處理中...
                </>
              ) : (
                '開始清除文字'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextRemovalTool;
