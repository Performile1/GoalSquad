'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

export default function AvatarCreator() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.id as string;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cartoonizedImage, setCartoonizedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'camera' | 'captured' | 'cartoonized'>('camera');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Failed to access camera:', error);
      alert('Kunde inte komma åt kameran. Kontrollera behörigheter.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    setStep('captured');
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCartoonizedImage(null);
    setStep('camera');
    startCamera();
  };

  const cartoonizeImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);

    try {
      // Send to AI cartoonization API
      const response = await apiFetch('/api/avatar/cartoonize', {
        method: 'POST',
                body: JSON.stringify({
          image: capturedImage,
          userId: sellerId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCartoonizedImage(data.cartoonizedImage);
        setStep('cartoonized');
      } else {
        throw new Error(data.error || 'Cartoonization failed');
      }
    } catch (error) {
      console.error('Cartoonization error:', error);
      alert('Kunde inte skapa cartoon-avatar. Försök igen.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveAvatar = async () => {
    if (!cartoonizedImage) return;

    try {
      const response = await apiFetch(`/api/sellers/${sellerId}/avatar/save`, {
        method: 'POST',
                body: JSON.stringify({
          avatarImage: cartoonizedImage,
        }),
      });

      if (response.ok) {
        alert('Avatar sparad! 🎉');
        router.push(`/sellers/${sellerId}/avatar`);
      } else {
        throw new Error('Failed to save avatar');
      }
    } catch (error) {
      console.error('Save avatar error:', error);
      alert('Kunde inte spara avatar. Försök igen.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            📸 Skapa Din Avatar
          </h1>
          <p className="text-xl text-gray-600">
            Ta ett foto så skapar vi en cool cartoon-version!
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-4 mb-8">
          <div className={`px-6 py-3 rounded-xl font-semibold ${
            step === 'camera' ? 'bg-primary-900 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1. Ta Foto
          </div>
          <div className={`px-6 py-3 rounded-xl font-semibold ${
            step === 'captured' ? 'bg-primary-900 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2. Granska
          </div>
          <div className={`px-6 py-3 rounded-xl font-semibold ${
            step === 'cartoonized' ? 'bg-primary-900 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3. Cartoonify!
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Camera View */}
          {step === 'camera' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
                
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-4 border-white border-dashed rounded-full opacity-50"></div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Placera ditt ansikte i cirkeln och tryck på knappen
                </p>
                <button
                  onClick={capturePhoto}
                  className="bg-gradient-to-r from-primary-900 to-primary-600 text-white px-12 py-4 rounded-full text-xl font-bold hover:shadow-lg transition transform hover:scale-105"
                >
                  📸 Ta Foto
                </button>
              </div>
            </motion.div>
          )}

          {/* Captured Photo Review */}
          {step === 'captured' && capturedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={retakePhoto}
                  className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  🔄 Ta Om
                </button>
                <button
                  onClick={cartoonizeImage}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-primary-900 to-primary-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {isProcessing ? '⏳ Skapar...' : '✨ Cartoonify!'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Cartoonized Result */}
          {step === 'cartoonized' && cartoonizedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  🎨 Din Cartoon Avatar!
                </h2>
                <p className="text-gray-600">Så här coolt ser du ut!</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Original */}
                <div>
                  <p className="text-center font-semibold mb-2">Original</p>
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={capturedImage || ''}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Cartoonized */}
                <div>
                  <p className="text-center font-semibold mb-2">Cartoon</p>
                  <div className="aspect-square bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl overflow-hidden border-4 border-primary-400">
                    <img
                      src={cartoonizedImage}
                      alt="Cartoonized"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={retakePhoto}
                  className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  🔄 Ta Nytt Foto
                </button>
                <button
                  onClick={saveAvatar}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition"
                >
                  💾 Spara Avatar
                </button>
              </div>
            </motion.div>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
