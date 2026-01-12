"use client";
import { useEffect, useRef, useState } from 'react';
import { sectionTerminalContent } from '../data/sectionTerminalContent.ts';

export const useTerminalTyping = (active: boolean, sectionId: string) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [terminalDone, setTerminalDone] = useState(false);
  const typingInProgressRef = useRef(false);

  useEffect(() => {
    if (!active) {
      setTerminalDone(false);
      typingInProgressRef.current = false;
      if (terminalRef.current) {
        terminalRef.current.innerHTML = '';
      }
      return;
    }
    const el = terminalRef.current;
    if (!el || el.childElementCount > 0 || typingInProgressRef.current) return;

    // Add typing class to hide content during typing
    const blogSection = document.getElementById(`${sectionId}-content`);
    if (blogSection) {
      blogSection.classList.add('typing-in-progress');
    }

    typingInProgressRef.current = true;
    let cancelled = false;
    const content = sectionTerminalContent[sectionId] || [];
    (async () => {
      for (const line of content) {
        if (cancelled) return;
        const lineDiv = document.createElement('div');
        lineDiv.style.lineHeight = '1.1';
        lineDiv.style.margin = '0';
        lineDiv.style.padding = '0';
        if (line.color) lineDiv.style.color = line.color;
        el.appendChild(lineDiv);
        const span = document.createElement('span');
        lineDiv.appendChild(span);
        for (let i = 0; i < line.text.length; i++) {
          if (cancelled) return;
          span.textContent += line.text[i];
          await new Promise(r => setTimeout(r, 6));
        }
        await new Promise(r => setTimeout(r, line.delay));
      }
      // Remove typing class and show content
      if (blogSection) {
        blogSection.classList.remove('typing-in-progress');
      }
      setTerminalDone(true);
      typingInProgressRef.current = false;
    })();
    return () => {
      cancelled = true;
      typingInProgressRef.current = false;
      // Cleanup: remove typing class
      if (blogSection) {
        blogSection.classList.remove('typing-in-progress');
      }
    };
  }, [active, sectionId]);

  return { terminalRef, terminalDone };
};