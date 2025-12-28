"use client";
import React from 'react';
import { TerminalLine } from '../types/TerminalLine.ts';

export const useTypewriter = (container: React.RefObject<HTMLElement | null>, lines: TerminalLine[] | undefined, active: boolean, sectionId: string, onFinish?: () => void) => {
  React.useEffect(() => {
    if (!active || !lines || !container.current) return;
    const el = container.current;
    el.innerHTML = '';
    let cancelled = false;

    // Add typing class to hide content during typing
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.add('typing-in-progress');
    }

    // Fallback: if nothing rendered after 800ms, dump full text instantly.
    const fallback = setTimeout(() => {
      if (cancelled) return;
      if (el.childElementCount === 0) {
        lines.forEach(line => {
          const lineDiv = document.createElement('div');
          lineDiv.className = 'terminal-line';
          lineDiv.style.color = line.color || '#00ff9d';
          if (line.text) {
            const timeSpan = document.createElement('span');
            timeSpan.style.color = '#00ffff';
            const now = new Date();
            timeSpan.textContent = `[${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}] `;
            lineDiv.appendChild(timeSpan);
            const textSpan = document.createElement('span');
            textSpan.textContent = line.text;
            lineDiv.appendChild(textSpan);
          } else {
            lineDiv.innerHTML = '&nbsp;';
          }
          el.appendChild(lineDiv);
        });
        // Remove typing class after fallback
        if (section) {
          section.classList.remove('typing-in-progress');
        }
      }
    }, 800);

    (async () => {
      for (const line of lines) {
        if (cancelled) return;
        // Skip rendering completely for empty lines to avoid adding blank gaps.
        // We still respect the configured delay but do not insert any DOM node.
        if (!line.text) {
          await new Promise(r => setTimeout(r, line.delay));
          continue;
        }
        const lineDiv = document.createElement('div');
        lineDiv.className = 'terminal-line';
        lineDiv.style.color = line.color || '#00ff9d';
        const timeSpan = document.createElement('span');
        timeSpan.style.color = '#00ffff';
        const now = new Date();
        timeSpan.textContent = `[${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}] `;
        lineDiv.appendChild(timeSpan);
        const textSpan = document.createElement('span');
        lineDiv.appendChild(textSpan);
        const cursor = document.createElement('span');
        cursor.textContent = '▋';
        cursor.style.animation = 'cursor-blink 1s infinite';
        lineDiv.appendChild(cursor);
        el.appendChild(lineDiv);
        for (let i = 0; i < line.text.length; i++) {
          if (cancelled) return;
          const ch = line.text[i];
          let delay = Math.random() * 3 + 3;
          if ('.!?,'.includes(ch)) delay += 10; else if (ch === ' ') delay += 3;
          if (Math.random() < 0.01) delay += Math.random() * 20;
          await new Promise(r => setTimeout(r, delay));
          textSpan.textContent += ch;
        }
        await new Promise(r => setTimeout(r, line.delay));
        cursor.remove();
      }
      clearTimeout(fallback);
      // Remove typing class after animation completes
      if (section) {
        section.classList.remove('typing-in-progress');
      }
      onFinish?.();
    })();

    return () => { 
      cancelled = true; 
      clearTimeout(fallback); 
      // Cleanup: remove typing class
      if (section) {
        section.classList.remove('typing-in-progress');
      }
    };
  }, [active, lines, container, sectionId, onFinish]);
};