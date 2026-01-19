'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { BBox } from '../types';

interface CanvasBboxMarkupProps {
  imageBase64: string;
  onBboxesChange: (bboxes: BBox[]) => void;
  bboxes: BBox[];
}

export const CanvasBboxMarkup: React.FC<CanvasBboxMarkupProps> = ({
  imageBase64,
  onBboxesChange,
  bboxes,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1);

  // Load and draw image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    imageRef.current.onload = () => {
      // Set canvas size to match image
      canvas.width = imageRef.current.width;
      canvas.height = imageRef.current.height;

      // Calculate scale based on container width
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const calculatedScale = Math.min(1, containerWidth / imageRef.current.width);
      setScale(calculatedScale);

      // Draw image and bboxes
      redraw(ctx);
    };

    imageRef.current.src = `data:image/png;base64,${imageBase64}`;
  }, [imageBase64]);

  // Redraw canvas with current bboxes
  const redraw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(imageRef.current, 0, 0);

    // Draw existing bboxes
    bboxes.forEach((bbox) => {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

      // Draw semi-transparent fill
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height);
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !isDrawing || !startPos) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / scale;
    const currentY = (e.clientY - rect.top) / scale;

    // Redraw everything
    redraw(ctx);

    // Draw current drawing bbox
    const width = currentX - startPos.x;
    const height = currentY - startPos.y;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.strokeRect(startPos.x, startPos.y, width, height);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(startPos.x, startPos.y, width, height);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !startPos || !isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const endX = (e.clientX - rect.left) / scale;
    const endY = (e.clientY - rect.top) / scale;

    const width = endX - startPos.x;
    const height = endY - startPos.y;

    // Only add bbox if it has meaningful size
    if (Math.abs(width) > 10 && Math.abs(height) > 10) {
      const newBbox: BBox = {
        x: Math.min(startPos.x, endX),
        y: Math.min(startPos.y, endY),
        width: Math.abs(width),
        height: Math.abs(height),
      };

      const newBboxes = [...bboxes, newBbox];
      onBboxesChange(newBboxes);

      // Redraw with new bbox
      if (ctx) {
        redraw(ctx);
        newBboxes.forEach((bbox) => {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
          ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height);
        });
      }
    }

    setIsDrawing(false);
    setStartPos(null);
  };

  const handleClearBboxes = () => {
    onBboxesChange([]);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      redraw(ctx);
    }
  };

  const handleRemoveLast = () => {
    const newBboxes = bboxes.slice(0, -1);
    onBboxesChange(newBboxes);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      redraw(ctx);
      newBboxes.forEach((bbox) => {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          拖動滑鼠在圖片上繪製矩形框標記需要清除的文字區域
        </p>
        <div className="flex gap-2">
          {bboxes.length > 0 && (
            <>
              <button
                onClick={handleRemoveLast}
                className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition"
              >
                撤銷最後一個
              </button>
              <button
                onClick={handleClearBboxes}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                清除所有
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDrawing(false);
            setStartPos(null);
          }}
          className="w-full cursor-crosshair block"
          style={{ maxHeight: '600px', objectFit: 'contain' }}
        />
      </div>

      {bboxes.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          已標記 {bboxes.length} 個區域
        </p>
      )}
    </div>
  );
};

export default CanvasBboxMarkup;
