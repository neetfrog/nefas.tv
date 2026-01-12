/* eslint-disable @next/next/no-img-element */
"use client";
import React from 'react';
import { TerminalLines } from './TerminalLines.tsx';
import { useSection } from './SectionContext.tsx';
import { InstagramEmbed } from './InstagramEmbed.tsx';

export const RendersGfxSection: React.FC = () => {
  const { active } = useSection();
  return (
    <div 
      id="gfx-content" 
      className="content-section"
      style={{ display: active === 'gfx-content' ? 'block' : 'none' }}
    >
        <TerminalLines sectionId="gfx-content" />
      <p>&gt; some abstract pixel statues i cooked up in blender, c4d, and houdini. it&apos;s mostly shiny spheres and particle nonsense.</p>

      <InstagramEmbed account="nefas.gfx" />

    </div>
  );
};
