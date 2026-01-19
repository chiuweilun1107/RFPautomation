import type { TextRemovalRequest, TextRemovalResponse } from '../types';

export const textRemovalApi = {
  /**
   * Call text removal API with image and options
   */
  async removeText(request: TextRemovalRequest): Promise<TextRemovalResponse> {
    const response = await fetch('/api/text-removal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to process image',
      }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Convert File to Base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 part after comma
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  },

  /**
   * Convert base64 to Blob
   */
  base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  },

  /**
   * Download image from base64
   */
  downloadImage(base64: string, filename: string = 'result.png'): void {
    const blob = this.base64ToBlob(base64);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
