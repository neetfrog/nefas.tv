/* eslint-disable @next/next/no-img-element */
"use client";
import React from 'react';
import { TerminalLines } from './TerminalLines.tsx';
import { useSection } from './SectionContext.tsx';
import { InstagramEmbed } from './InstagramEmbed.tsx';

export const Renders3DSection: React.FC = () => {
  const { active } = useSection();
  return (
    <div 
      id="3d-content" 
      className="content-section"
      style={{ display: active === '3d-content' ? 'block' : 'none' }}
    >
  <h2>&gt; 3D stuff</h2>
        <TerminalLines sectionId="3d-content" />
      <p>&gt; some abstract pixel statues i cooked up in blender, c4d, and houdini. it&apos;s mostly shiny spheres and particle nonsense.</p>

      <InstagramEmbed />

    </div>
  );
};
