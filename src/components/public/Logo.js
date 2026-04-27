// Brand logo — masthead asset that swaps based on context.
//
// On the WV News umbrella site (homepage, generic admin), we render
// the umbrella mark. On a section or article page tagged for a specific
// publication, we render that publication's color logo instead. Falls
// back to the umbrella if the publication has no logoFile yet.
//
// Props:
//   variant:        'full' | 'mark' | 'icon' — only applies to the WV News umbrella
//   height:         rendered height in px (width scales proportionally)
//   className:      passed through for layout
//   publicationId:  override — render this publication's logo instead

import Image from 'next/image';
import { sites } from '@/data/mock';

// Umbrella variants.
const UMBRELLA = {
  full: { src: '/publications/wvnews.png',    w: 486,  h: 139, alt: 'WV News — West Virginia\'s News' },
  mark: { src: '/logo-wvnews-mark.png', w: 1285, h: 246, alt: 'WV News' },
  icon: { src: '/logo-wvnews-icon.jpg', w: 260,  h: 260, alt: 'WV News' },
};

export default function Logo({ variant = 'full', height = 44, className = '', publicationId = null }) {
  // If a specific publication is requested AND it has a logoFile, render
  // it. Otherwise drop back to the umbrella mark.
  let src;
  if (publicationId) {
    const pub = sites.find(s => s.id === publicationId);
    if (pub?.logoFile) {
      // We don't know the source dimensions of every publication logo;
      // most are ~3:1 wordmarks. Use a reasonable default ratio that
      // gets overridden by next/image's responsive sizing.
      src = { src: pub.logoFile, w: 600, h: 200, alt: pub.name };
    }
  }
  if (!src) src = UMBRELLA[variant] || UMBRELLA.full;

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
