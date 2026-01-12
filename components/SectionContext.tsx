"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type SectionId =
  | 'home-content'
  | 'video-content'
  | 'photo-content'
  | 'gfx-content'
  | 'webdev-content'
  | 'misc-content';

interface SectionContextValue {
  active: SectionId;
  setActive: (id: SectionId) => void;
}

const SectionContext = createContext<SectionContextValue | undefined>(undefined);

export const SectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActiveState] = useState<SectionId>('home-content');
  
  const setActive = useCallback((id: SectionId) => {
    setActiveState(id);
    // Update URL hash for deep linking
    if (typeof window !== 'undefined') {
      window.location.hash = id;
    }
  }, []);

  // Handle initial hash on mount and hash changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as SectionId;
      if (hash && [
        'home-content', 'video-content', 'photo-content', 
        '3d-content', 'webdev-content', 'blog-content', 'misc-content'
      ].includes(hash)) {
        setActiveState(hash);
      }
    };

    // Set initial section based on URL hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <SectionContext.Provider value={{ active, setActive }}>
      {children}
    </SectionContext.Provider>
  );
};

export const useSection = () => {
  const ctx = useContext(SectionContext);
  if (!ctx) throw new Error('useSection must be used within SectionProvider');
  return ctx;
};
