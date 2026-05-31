import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kelowna Wildlife Tracker',
  description:
    'A mobile-friendly wildlife observation application for Kelowna, British Columbia. Log sightings with GPS, photos, and notes.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#31742e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-CA">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
