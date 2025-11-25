"use client";
import React, { useEffect } from 'react';

export const InstagramEmbed: React.FC = () => {
  useEffect(() => {
    if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.instagram.com/embed.js';
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div style={{ marginTop: 32, textAlign: 'center' }}>
      <h3 style={{ color: '#00ff9d', textAlign: 'center' }}>My Instagram Feed,<br />double-tap to boost my dopamine levels.</h3>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <blockquote
          className="instagram-media"
          data-instgrm-permalink="https://www.instagram.com/nefas.gfx/"
          data-instgrm-version="14"
          style={{
            background: '#fff',
            border: 0,
            margin: '1em auto',
            maxWidth: 540,
            width: '100%',
            minWidth: 326
          }}
        >
          <a href="https://www.instagram.com/nefas.gfx/" target="_blank" rel="noopener" style={{ color: '#125688', fontWeight: 'bold' }}>
            View on Instagram
          </a>
        </blockquote>
      </div>
    </div>
  );
};