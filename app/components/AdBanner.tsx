'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface AdButton {
  text: string;
  link_url: string;
  link_type: 'internal' | 'external';
  internal_link_path?: string;
  color: string;
  background_color: string;
}

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  link_type: 'internal' | 'external';
  internal_link_path?: string;
  alt_text?: string;
  button_config: AdButton[];
}

interface AdBannerProps {
  placementName: string;
  className?: string;
}

export default function AdBanner({ placementName, className = '' }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewTracked, setViewTracked] = useState(false);

  useEffect(() => {
    fetchAd();
  }, [placementName]);

  const fetchAd = async () => {
    try {
      const response = await fetch(`/api/ads/active?placement=${placementName}`);
      const data = await response.json();
      if (data.ad) {
        setAd(data.ad);
      }
    } catch (error) {
      console.error('Failed to fetch ad:', error);
    } finally {
      setLoading(false);
    }
  };

  // Track view when ad is displayed
  useEffect(() => {
    if (ad && !viewTracked) {
      trackView();
      setViewTracked(true);
    }
  }, [ad, viewTracked]);

  const trackView = async () => {
    if (!ad) return;
    try {
      await fetch(`/api/ads/${ad.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'view' }),
      });
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  const handleClick = () => {
    if (!ad) return;
    try {
      fetch(`/api/ads/${ad.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'click' }),
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  };

  const handleButtonClick = (button: AdButton) => {
    handleClick();
  };

  const renderLink = (href: string, internal: boolean, children: React.ReactNode) => {
    if (internal) {
      return <Link href={href}>{children}</Link>;
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  };

  if (loading || !ad) {
    return null;
  }

  const linkTarget = ad.link_type === 'internal' && ad.internal_link_path 
    ? ad.internal_link_path 
    : ad.link_url;

  const isInternal = ad.link_type === 'internal';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-xl overflow-hidden shadow-lg ${className}`}
    >
      {renderLink(
        linkTarget,
        isInternal,
        <div onClick={handleClick} className="block relative">
          <img
            src={ad.image_url}
            alt={ad.alt_text || ad.title}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
          
          {/* Buttons overlay */}
          {ad.button_config && ad.button_config.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
              {ad.button_config.map((button, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleButtonClick(button);
                  }}
                  className="px-4 py-2 rounded-lg font-semibold text-sm transition hover:opacity-90"
                  style={{
                    color: button.color,
                    backgroundColor: button.background_color,
                  }}
                >
                  {renderLink(
                    button.link_type === 'internal' && button.internal_link_path
                      ? button.internal_link_path
                      : button.link_url,
                    button.link_type === 'internal',
                    <span className="block">{button.text}</span>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
