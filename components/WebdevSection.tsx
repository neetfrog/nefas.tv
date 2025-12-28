/* eslint-disable @next/next/no-img-element */
"use client";
import React from 'react';
import { TerminalLines } from './TerminalLines.tsx';
import { useSection } from './SectionContext.tsx';
import { useFetchJson } from './hooks.ts';
import type { WebdevProjectItem } from '../lib/types/content.ts';

export const WebdevSection: React.FC = () => {
  const { active } = useSection();
  const { data, loading, error } = useFetchJson<WebdevProjectItem[]>('/data/webdev.json');
  return (
    <div 
      id="webdev-content" 
      className="content-section"
      style={{ display: active === 'webdev-content' ? 'block' : 'none' }}
    >

      <TerminalLines sectionId="webdev-content" />
      <p>&gt; i occasionally write code that gets deployed to the internet. no startup grind, no VC buzzwords — just late-night commits and whatever felt fun to build.</p>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>[ERROR] {error}</p>}
      <div className="grid-container">
  {data?.map((p: WebdevProjectItem) => {
    const content = (
      <>
        <img src={p.image} alt={p.title} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 6 }} />
        <h3>{p.title}</h3>
        <p>{p.description}</p>
      </>
    );
    return p.url ? (
      <a key={p.title} href={p.url} target="_blank" rel="noopener noreferrer" className="grid-item">
        {content}
      </a>
    ) : (
      <div key={p.title} className="grid-item">
        {content}
      </div>
    );
  })}
      </div>
    </div>
  );
};
