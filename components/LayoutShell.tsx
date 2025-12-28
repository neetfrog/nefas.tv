"use client";
import React from 'react';
import { Header } from './Header.tsx';
import { BackgroundEffects } from './BackgroundEffects.tsx';
import { WinampPlayer } from './WinampPlayer.tsx';
import { Navigation } from './Navigation.tsx';
import { SectionProvider } from './SectionContext.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { HomeSection } from './HomeSection.tsx';
import { BlogSection } from './BlogSection.tsx';
import { PhotoSection } from './PhotoSection.tsx';
import { VideoSection } from './VideoSection.tsx';
import { Renders3DSection } from './Renders3DSection.tsx';
import { WebdevSection } from './WebdevSection.tsx';
import { MiscSection } from './MiscSection.tsx';

const Inner: React.FC = () => {
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (tgt) {
        // click handler for potential future use
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  return (
    <>
      <BackgroundEffects />
      <div className="site-container">
        <Header />
        <WinampPlayer />
        <Navigation />
        <main id="content-area">
          <ErrorBoundary>
            <HomeSection />
            <VideoSection />
            <PhotoSection />
            <Renders3DSection />
            <WebdevSection />
            <BlogSection />
            <MiscSection />
          </ErrorBoundary>
        </main>
        <footer>
          <div className="footer-content">
            <div className="footer-left">
              <span className="footer-copyright">© 2025 nefas.tv</span>
            </div>
            <div className="footer-center">
              <span className="footer-status">[ ONLINE ]</span>
            </div>
            <div className="footer-right">
              <span className="footer-terminal">sudo ./nefas.tv --mode=guest</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export const LayoutShell: React.FC = () => {
  return (
    <SectionProvider>
      <Inner />
    </SectionProvider>
  );
};
