"use client";
import React, { useState } from 'react';
import { TerminalLines } from './TerminalLines.tsx';
import { useSection } from './SectionContext.tsx';
import { useFetchJson } from './hooks.ts';

interface StatusItem { msg: string; date: string; }
interface Artifact { name: string; path: string; desc: string; }
interface LinkItem { title: string; url: string; }

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
  const artifacts = useFetchJson<Artifact[]>('/data/artifacts.json');
  const status = useFetchJson<StatusItem[]>('/data/status.json');
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
      
      <AccordionSection title="&gt;&gt; digital artifacts">
        <div className="artifacts-list">
          {artifacts.loading && <p>Loading artifacts...</p>}
          {artifacts.data?.map((a: Artifact, i: number) => <p key={a.path ?? a.name ?? i}><a href={'/data/' + a.path} download>{a.name}</a> - {a.desc}</p>)}
        </div>
      </AccordionSection>
      
      <AccordionSection title="&gt;&gt; status updates">
        <div className="status-log">
          {status.loading && <p>Loading status...</p>}
          {status.data?.map((s: StatusItem, i: number) => <p key={s.date ?? i}>{s.date}: {s.msg}</p>)}
        </div>
      </AccordionSection>
    </div>
  );
};
