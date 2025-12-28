/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata, Viewport } from 'next';
import './globals.css';
import React from 'react';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export const metadata: Metadata = {
  title: 'nefas.tv - VISUALS, VIBES & VARIOUS EXPERIMENTS',
  description: 'A vaporwave-inspired personal website with retro aesthetics and interactive elements',
  metadataBase: new URL('https://nefas.tv'),
  openGraph: {
    title: 'nefas.tv - VISUALS, VIBES & VARIOUS EXPERIMENTS',
    description: 'A vaporwave-inspired personal website with retro aesthetics and interactive elements',
    url: 'https://nefas.tv',
    siteName: 'nefas.tv'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "nefas.tv",
    "url": "https://nefas.tv",
    "description": "A vaporwave-inspired personal website with retro aesthetics and interactive elements"
  };

  return (
    <html lang="en">
      <head>
        {/* Load VT323 from Google Fonts for the App Router (public/index.html is not used) */}
        <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
        <meta name="author" content="nefas" />
        <meta name="robots" content="index,follow" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ fontFamily: 'VT323, monospace', color: '#00ff9d' }}>
        {children}
      </body>
    </html>
  );
}
