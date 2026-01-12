"use client";
import React, { useEffect, useCallback, useState } from 'react';
import { TerminalLines } from './TerminalLines.tsx';
import { useSection } from './SectionContext.tsx';
import { useFetchJson } from './hooks.ts';
import { usePersistedState } from '../lib/hooks/usePersistedState.ts';

interface StatusItem { msg: string; date: string; }
interface Artifact { name: string; path: string; desc: string; }
interface LinkItem { title: string; url: string; }
interface Post { id: string; title: string; date: string; tags: string[]; content: { en: string[] }; }

const AccordionSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <h3 
        style={{ 
          marginTop: 40, 
          marginBottom: 20, 
          color: 'var(--secondary-color)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {title} 
        <span 
          style={{
            display: 'inline-block',
            transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          ▼
        </span>
      </h3>
      <div 
        style={{
          maxHeight: expanded ? 'none' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {children}
      </div>
    </>
  );
};

export const MiscSection: React.FC = () => {
  const { active } = useSection();
  const links = useFetchJson<LinkItem[]>('/data/links.json');
  const [posts, setPosts] = useState<Post[]>([]);
  const [expanded, setExpanded] = usePersistedState<Set<string>>('expandedPosts', new Set());

  // Load posts when section becomes active
  useEffect(() => {
    if (active !== 'misc-content') return;
    fetch('/data/posts.json').then(r => r.json()).then((p: Post[]) => setPosts(p));
  }, [active]);

  const toggle = useCallback((title: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  }, [setExpanded]);

  return (
    <div 
      id="misc-content" 
      className="content-section"
      style={{ display: active === 'misc-content' ? 'block' : 'none' }}
    >
        <TerminalLines sectionId="misc-content" />

      <AccordionSection title="&gt;&gt; links">
        <div className="links-container">
          {links.loading && <p>Loading links...</p>}
          {links.data?.map((l: LinkItem, i: number) => <p key={l.url ?? l.title ?? i}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a></p>)}
        </div>
      </AccordionSection>
      
      <AccordionSection title="&gt;&gt; blog">
        <div style={{ marginTop: 24 }}>
          {posts.map((p, idx) => (
            <div key={p.id ?? p.title ?? idx} style={{ marginBottom: 20 }}>
              <h4 
                style={{ 
                  color: 'var(--secondary-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8
                }}
                onClick={() => toggle(p.title)}
              >
                {p.title} 
                <span 
                  style={{
                    display: 'inline-block',
                    transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
                    transform: expanded.has(p.title) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                >
                  ▼
                </span>
              </h4>
              <div 
                style={{
                  maxHeight: expanded.has(p.title) ? 'none' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {expanded.has(p.title) && (
                  <div style={{ fontSize: '0.9em', color: 'var(--text-color)', marginBottom: 8 }}>
                    {new Date(p.date).toLocaleDateString()} {p.tags && p.tags.length > 0 && `• ${p.tags.join(', ')}`}
                  </div>
                )}
                {p.content.en.map((paragraph, pidx) => (
                  <p key={pidx} style={{ marginBottom: 6, lineHeight: 1.18 }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>
    </div>
  );
};
