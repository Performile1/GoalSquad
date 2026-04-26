'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageBlob: Blob, editedImageUrl: string) => void;
  onCancel: () => void;
}

export default function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<'crop' | 'remove-bg'>('crop');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate cropped image
  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise<{ blob: Blob; url: string }>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      }, 'image/jpeg', 0.95);
    });
  }, [completedCrop]);

  // Remove background using API
  const removeBackground = async () => {
    setProcessing(true);
    try {
      // Call remove.bg API or similar service
      const formData = new FormData();
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      formData.append('image', blob);

      const result = await fetch('/api/images/remove-background', {
        method: 'POST',
        body: formData,
      });

      if (result.ok) {
        const data = await result.json();
        setPreviewUrl(data.imageUrl);
      } else {
        alert('Kunde inte ta bort bakgrund');
      }
    } catch (error) {
      console.error('Remove background error:', error);
      alert('Ett fel uppstod');
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    setProcessing(true);
    try {
      if (mode === 'crop' && completedCrop) {
        const result = await generateCroppedImage();
        if (result) {
          onSave(result.blob, result.url);
        }
      } else if (mode === 'remove-bg' && previewUrl) {
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        onSave(blob, previewUrl);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Kunde inte spara bild');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Redigera Bild
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              X
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-3">
            <button
              onClick={() => setMode('crop')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                mode === 'crop'
                  ? 'bg-primary-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Beskär
            </button>
            <button
              onClick={() => setMode('remove-bg')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                mode === 'remove-bg'
                  ? 'bg-primary-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ta bort bakgrund
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="p-6">
          {mode === 'crop' ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Dra för att välja område att beskära
              </p>
              <div className="max-h-[500px] overflow-auto bg-gray-100 rounded-lg p-4">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={undefined}
                >
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Crop"
                    className="max-w-full"
                  />
                </ReactCrop>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                AI tar automatiskt bort bakgrunden från bilden
              </p>
              
              {!previewUrl ? (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto mb-6">
                    <img
                      src={imageUrl}
                      alt="Original"
                      className="rounded-lg shadow-lg"
                    />
                  </div>
                  <button
                    onClick={removeBackground}
                    disabled={processing}
                    className="bg-primary-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-800 transition disabled:opacity-50"
                  >
                    {processing ? 'Bearbetar...' : 'Ta bort bakgrund'}
                  </button>
                  <p className="text-xs text-gray-500 mt-3">
                    Använder AI för att automatiskt detektera och ta bort bakgrund
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Original</h3>
                    <img
                      src={imageUrl}
                      alt="Original"
                      className="rounded-lg shadow-lg w-full"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Resultat</h3>
                    <div className="rounded-lg shadow-lg w-full bg-checkerboard">
                      <img
                        src={previewUrl}
                        alt="Processed"
                        className="rounded-lg w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={processing || (mode === 'crop' && !completedCrop) || (mode === 'remove-bg' && !previewUrl)}
            className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Sparar...' : 'Spara'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .bg-checkerboard {
          background-image: 
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
}

// Simple image crop component (without external library)
export function SimpleImageCrop({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const [processing, setProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'free' | '1:1' | '16:9' | '4:3'>('free');

  const handleCrop = async () => {
    setProcessing(true);
    try {
      // Simple crop implementation
      const formData = new FormData();
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      formData.append('image', blob);
      formData.append('aspectRatio', aspectRatio);

      const result = await fetch('/api/images/crop', {
        method: 'POST',
        body: formData,
      });

      if (result.ok) {
        const data = await result.json();
        const croppedBlob = await fetch(data.imageUrl).then(r => r.blob());
        onSave(croppedBlob, data.imageUrl);
      } else {
        alert('Kunde inte beskära bild');
      }
    } catch (error) {
      console.error('Crop error:', error);
      alert('Ett fel uppstod');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Beskär Bild
        </h2>

        <div className="mb-6">
          <img src={imageUrl} alt="Preview" className="w-full rounded-lg" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bildformat
          </label>
          <div className="flex gap-3">
            {(['free', '1:1', '16:9', '4:3'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  aspectRatio === ratio
                    ? 'bg-primary-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {ratio === 'free' ? 'Fri' : ratio}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-100"
          >
            Avbryt
          </button>
          <button
            onClick={handleCrop}
            disabled={processing}
            className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {processing ? 'Bearbetar...' : 'Beskär'}
          </button>
        </div>
      </div>
    </div>
  );
}
