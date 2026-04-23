// WV News logo — official brand asset from the NCWV Media Google Drive.
//
//   public/logo-wvnews.png       — full wordmark (circle mark + "WVNews" + tagline)
//   public/logo-wvnews-mark.png  — wordmark only (circle mark + "WVNews", no tagline)
//   public/logo-wvnews-icon.jpg  — circle mark only (for social / favicon)
//
// Props:
//   variant: 'full' (default — with tagline) | 'mark' (no tagline) | 'icon' (circle only)
//   height:  rendered height in px; width scales proportionally
//   className: passed through for layout

import Image from 'next/image';

const SOURCES = {
  // Current masthead logo pulled from wvnews.com — mark + "WVNews" + navy banner.
  full: { src: '/logo-wvnews.png', w: 486, h: 139, alt: 'WV News — West Virginia\'s News' },
  // Older serif wordmark without the banner, kept as an alt.
  mark: { src: '/logo-wvnews-mark.png', w: 1285, h: 246, alt: 'WV News' },
  // Circular profile mark — used on dark backgrounds where the navy wordmark would disappear.
  icon: { src: '/logo-wvnews-icon.jpg', w: 260, h: 260, alt: 'WV News' },
};

export default function Logo({ variant = 'full', height = 44, className = '' }) {
  const src = SOURCES[variant] || SOURCES.full;
  const width = Math.round((src.w / src.h) * height);

  return (
    <Image
      src={src.src}
      alt={src.alt}
      width={width}
      height={height}
      priority={variant !== 'icon'}
      className={className}
      style={{ height, width: 'auto' }}
    />
  );
}
