"use client";
import React, { useEffect } from 'react';

interface InstagramPostEmbedProps {
  postUrl: string;
}

export const InstagramPostEmbed: React.FC<InstagramPostEmbedProps> = ({ postUrl }) => {
  useEffect(() => {
    if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.instagram.com/embed.js';
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div style={{ marginBottom: 16 }}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={postUrl}
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
        <a href={postUrl} target="_blank" rel="noopener" style={{ color: '#125688', fontWeight: 'bold' }}>
          View on Instagram
        </a>
      </blockquote>
    </div>
  );
};