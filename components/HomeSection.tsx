/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useCallback } from 'react';
import { TerminalLines } from './TerminalLines.tsx';
import { useSection } from './SectionContext.tsx';

import { SectionId } from './SectionContext.tsx';

const commandMap: Record<string, SectionId> = {
  photo: 'photo-content',
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

  const appendLine = (text: string, color = '#00ff9d') => {
    const outputEl = document.querySelector('#home-content .terminal-output') as HTMLElement | null;
    if (!outputEl) return;
    
    const lines = text.split('\n');
    lines.forEach(line => {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'terminal-line';
      lineDiv.style.color = color;
      const timeSpan = document.createElement('span');
      timeSpan.style.color = '#00ffff';
      const now = new Date();
      timeSpan.textContent = `[${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}] `;
      lineDiv.appendChild(timeSpan);
      const textSpan = document.createElement('span');
      textSpan.textContent = line;
      lineDiv.appendChild(textSpan);
      outputEl.appendChild(lineDiv);
    });
    
    outputEl.scrollTop = outputEl.scrollHeight;
  };

  const doEgg = () => {
    appendLine(`    (\\_/)\n   ( •_•)\n  / >🧃  Easter egg!`, '#00ff9d');
  };

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = command.toLowerCase().trim();
      if (commandMap[cmd]) {
        setActive(commandMap[cmd]);
      } else {
        // Echo the command
        appendLine(`> ${cmd}`, '#00ff9d');
        
        // Handle easter egg commands
        switch (cmd) {
          case 'egg':
            doEgg();
            break;
          default:
            if (cmd) {
              appendLine(`Unknown command: ${cmd}.`, '#ffaa00');
            }
        }
      }
      setCommand('');
    }
  };

  React.useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

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
              placeholder="try: webdev | photo | gfx | video | misc | egg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
