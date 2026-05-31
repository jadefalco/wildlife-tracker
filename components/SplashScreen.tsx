'use client';

import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 2800);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 3800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-nature-50 transition-opacity duration-500 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={fading}
    >
      {/* Main content — centered vertically and horizontally */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6">
        <img
          src="/logo.png"
          alt="Kelowna Wildlife Tracker"
  className="w-72 sm:w-96 h-auto max-w-[85vw] object-contain"
          draggable={false}
        />

        <div className="mt-8 flex items-center gap-1 text-nature-700 font-medium text-base">
          <span>Loading</span>
          <span className="inline-flex gap-0.5">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </span>
        </div>
      </div>

      {/* Footer branding */}
      <div className="pb-8 sm:pb-10 flex flex-col items-center">
        <span className="text-xs text-nature-500 mb-2 tracking-wide">Powered by</span>
        <a
          href="https://truenorth.com"
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-80 hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src="/truenorth-logo.png"
            alt="True North"
             className="w-44   sm:w-56 h-auto max-w-[85vw] object-contain"
            draggable={false}
          />
        </a>
      </div>
    </div>
  );
}
