import './globals.css';
import { Suspense } from 'react';
import Script from 'next/script';
import { Source_Serif_4, Inter } from 'next/font/google';
import BreakingNewsRibbon from '@/components/public/BreakingNewsRibbon';
import GA4Tracker from '@/components/public/GA4Tracker';
import { GAM_IS_LIVE } from '@/lib/gam-config';

// Atlantic-clean typography pairing.
//   Source Serif 4 — refined newsy serif used for headlines + display
//   Inter         — clean grotesque sans used for body, UI, captions
// Both are self-hosted via next/font so there's zero render flash and
// no Google Fonts request on the critical path.
const serifDisplay = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
});
const sansBody = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata = {
  title: 'WVNews - West Virginia News & Information',
  description: 'West Virginia\'s trusted source for breaking news, sports, politics, and community coverage.',
  openGraph: {
    title: 'WVNews',
    description: 'West Virginia\'s trusted source for news',
    type: 'website',
    locale: 'en_US',
    siteName: 'WVNews',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serifDisplay.variable} ${sansBody.variable}`}>
      <head>
        {/* Google Publisher Tag — loads once, initializes the ad queue so
            individual AdSlot components can define slots on mount. Loaded
            on all pages (including admin) so ad previews work everywhere,
            but actual ad requests only fire from placements on public pages. */}
        {GAM_IS_LIVE && (
          <>
            <Script
              id="gpt-js"
              src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
              strategy="afterInteractive"
            />
            <Script id="gpt-init" strategy="afterInteractive">
              {`window.googletag = window.googletag || { cmd: [] };`}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-screen bg-[#fafafa] font-body antialiased text-ink-900">
        {/* GA4 — loads + fires page_view only on public routes (admin is
            excluded inside the component so internal traffic doesn't skew
            public-site stats). */}
        <Suspense>
          <GA4Tracker />
        </Suspense>
        {/* Renders only on public routes; reads breaking stories from Firestore */}
        <Suspense>
          <BreakingNewsRibbon />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
