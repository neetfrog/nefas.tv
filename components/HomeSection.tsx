/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useCallback } from 'react';
import { TerminalLines } from './TerminalLines.tsx';
import { useSection } from './SectionContext.tsx';

import { SectionId } from './SectionContext.tsx';

const commandMap: Record<string, SectionId> = {
  photos: 'photo-content',
  photography: 'photo-content',
  '3d': 'gfx-content',
  renders: 'gfx-content',
  gfx: 'gfx-content',
  webdev: 'webdev-content',
  web: 'webdev-content',
  video: 'video-content',
  videos: 'video-content',
  misc: 'misc-content'
};

export const HomeSection: React.FC = () => {
  const { active, setActive } = useSection();
  const [typingFinished, setTypingFinished] = useState(false);
  const [command, setCommand] = useState('');

  const handleFinish = useCallback(() => {
    setTypingFinished(true);
  }, []);

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = command.toLowerCase().trim();
      if (commandMap[cmd]) {
        setActive(commandMap[cmd]);
      } else if (cmd === 'help') {
        alert('Available commands: photos, 3d, webdev, blog, video, misc');
      } else if (cmd) {
        alert(`Unknown command: ${cmd}. Type 'help' for commands.`);
      }
      setCommand('');
    }
  };

  return (
    <div
      id="home-content"
      className="content-section"
      style={{ display: active === 'home-content' ? 'block' : 'none' }}
    >
      <TerminalLines sectionId="home-content" onFinish={handleFinish} />
      {typingFinished && (
        <div style={{ marginTop: 20 }}>
          <div style={{ color: '#00ff9d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span aria-hidden style={{ flex: '0 0 auto' }}>&gt;</span>
            <input
              type="text"
              aria-label="Command input"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleCommand}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00ff9d',
                fontFamily: "'VT323', monospace",
                fontSize: 'inherit',
                lineHeight: 1.15,
                outline: 'none',
                flex: 1,
                minWidth: 0,
                letterSpacing: '0.02em'
              }}
              placeholder="try: photos | gfx | webdev"
            />
          </div>
        </div>
      )}
    </div>
  );
};
