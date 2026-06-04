'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  url: string;
  duration?: number;
}

export default function AudioPlayer({ url, duration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setIsLoaded(true);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const audioDuration = duration || (audioRef.current?.duration || 0);

  return (
    <div className="mt-2 bg-gray-100 rounded-lg px-3 py-2">
      <audio ref={audioRef} src={url} className="hidden" />
      
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={!isLoaded}
          className="w-8 h-8 bg-primary-900 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="3" y="2" width="3" height="10" fill="currentColor" />
              <rect x="8" y="2" width="3" height="10" fill="currentColor" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 2L12 7L3 12V2Z" fill="currentColor" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={audioDuration}
            value={currentTime}
            onChange={handleSeek}
            disabled={!isLoaded}
            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer disabled:opacity-40"
          />
        </div>

        <span className="text-xs text-gray-600 min-w-[60px] text-right">
          {isLoaded ? formatTime(currentTime) : '...'} / {isLoaded ? formatTime(audioDuration) : '...'}
        </span>
      </div>
    </div>
  );
}
