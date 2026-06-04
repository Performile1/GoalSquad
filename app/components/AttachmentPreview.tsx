'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface AttachmentPreviewProps {
  url: string;
  type?: string;
  name?: string;
  size?: number;
}

export default function AttachmentPreview({ url, type, name, size }: AttachmentPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const isImage = type?.startsWith('image/');
  const isPdf = type === 'application/pdf';

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isImage) {
    return (
      <>
        <div
          className="mt-2 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition"
          onClick={() => setExpanded(true)}
        >
          <img src={url} alt="Attachment" className="max-w-full h-auto rounded-lg" />
        </div>

        {expanded && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setExpanded(false)}
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={url}
              alt="Expanded attachment"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
              onClick={() => setExpanded(false)}
            >
              ×
            </button>
          </div>
        )}
      </>
    );
  }

  if (isPdf) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 hover:bg-gray-200 transition"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 4C4 2.9 4.9 2 6 2H14C15.1 2 16 2.9 16 4V16C16 17.1 15.1 18 14 18H6C4.9 18 4 17.1 4 16V4Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 8H12M8 12H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{name || 'PDF Document'}</p>
          {size && <p className="text-xs text-gray-500">{formatSize(size)}</p>}
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L14 8L8 14M14 8H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>
    );
  }

  // Generic file
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 hover:bg-gray-200 transition"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 4C4 2.9 4.9 2 6 2H14C15.1 2 16 2.9 16 4V16C16 17.1 15.1 18 14 18H6C4.9 18 4 17.1 4 16V4Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 8H12M8 12H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{name || 'File'}</p>
        {size && <p className="text-xs text-gray-500">{formatSize(size)}</p>}
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L14 8L8 14M14 8H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
  );
}
