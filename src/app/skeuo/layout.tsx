import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VibeGames - Skeuomorphic Edition',
  description: 'A tactile prototype of VibeGames.ninja',
};

export default function SkeuoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-900 font-sans antialiased text-neutral-100">
      {/* We apply a subtle grainy texture over the entire skeuo app for more realism */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      {children}
    </div>
  );
}
