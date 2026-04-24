'use client';
// Loads GA4 (gtag.js) on public routes only, and fires a page_view event on
// every navigation with custom dimensions for author, section, storyId,
// publication, breaking, and access tier. The admin surface opts out entirely
// so internal editor traffic doesn't skew public-site analytics.

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { GA4_MEASUREMENT_ID, GA4_IS_LIVE } from '@/lib/ga-config';

export default function GA4Tracker({ dimensions }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Never track admin pages. Belt-and-suspenders: the layout excludes the
  // tracker, but if someone ever imports it in an admin context, this guards.
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    if (!GA4_IS_LIVE || isAdmin) return;
    if (typeof window.gtag !== 'function') return;

    const query = searchParams?.toString();
    const page_path = query ? `${pathname}?${query}` : pathname;

    window.gtag('event', 'page_view', {
      page_path,
      page_location: window.location.href,
      page_title: document.title,
      ...(dimensions || {}),
    });
  }, [pathname, searchParams, dimensions, isAdmin]);

  if (!GA4_IS_LIVE || isAdmin) return null;

  // Load gtag.js once; subsequent navigations fire events via the effect above.
  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA4_MEASUREMENT_ID}', {
            send_page_view: false /* we fire manually with custom dims */
          });
        `}
      </Script>
    </>
  );
}
