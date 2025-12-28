/* eslint-disable @next/next/no-img-element */
"use client";
import React from 'react';
import { TerminalLines } from './TerminalLines.tsx';
import { useSection } from './SectionContext.tsx';
import { InstagramEmbed } from './InstagramEmbed.tsx';

export const PhotoSection: React.FC = () => {
  const { active } = useSection();

  return (
    <div
      id="photo-content"
      className="content-section"
      style={{ display: active === 'photo-content' ? 'block' : 'none' }}
    >

      <TerminalLines sectionId="photo-content" />
      <p>&gt; i point my camera at things. mostly around the streets.</p>

      <InstagramEmbed account="nefas.jpg" />
    </div>
  );
};
