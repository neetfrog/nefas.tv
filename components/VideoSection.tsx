/* eslint-disable @next/next/no-img-element */
"use client";
import React from 'react';
import { TerminalLines } from './TerminalLines.tsx';
import { useSection } from './SectionContext.tsx';
import { useFetchJson } from './hooks.ts';
import type { VideoItem } from '../lib/types/content.ts';

export const VideoSection: React.FC = () => {
  const { active } = useSection();
  const { data, loading, error } = useFetchJson<VideoItem[]>('/data/videos.json');
  return (
    <div 
      id="video-content" 
      className="content-section"
      style={{ display: active === 'video-content' ? 'block' : 'none' }}
    >
        <TerminalLines sectionId="video-content" />
      <p>&gt; a collection of moving pictures to rot your brain. i&apos;ll replace these with my own stuff eventually. probably.</p>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>[ERROR] {error}</p>}
      <div className="grid-container">
  {data?.slice(0, 30).map((v: VideoItem) => (
          <div key={v.title} className="grid-item" style={{ cursor: 'pointer' }}>
            <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 6 }} />
            <h3>{v.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};
