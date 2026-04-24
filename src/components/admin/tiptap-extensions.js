// Custom TipTap nodes for embedded video + YouTube.
//
// TipTap's StarterKit doesn't know about <video> or <iframe>, so ProseMirror
// would strip them on input/output. These extensions register the nodes so
// the editor preserves them in both directions.
//
// Keeping v2 API (the project is pinned at @tiptap/core@^2.2.0).

import { Node, mergeAttributes } from '@tiptap/core';

// ---------- Video (Firebase-hosted MP4/WEBM) ----------
export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      preload: { default: 'metadata' },
    };
  },
  parseHTML() {
    return [{ tag: 'video[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, { controls: 'true', preload: 'metadata', class: 'wvn-video' }),
    ];
  },
});

// ---------- YouTube embed ----------
export const YouTube = Node.create({
  name: 'youtube',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      videoId: { default: null },
      url: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'iframe[src*="youtube.com/embed/"]' }];
  },
  renderHTML({ node }) {
    const videoId = node.attrs.videoId;
    const src = videoId ? `https://www.youtube.com/embed/${videoId}` : (node.attrs.url || '');
    return [
      'div',
      { class: 'wvn-youtube-wrapper', 'data-video-id': videoId || '' },
      [
        'iframe',
        {
          src,
          width: '100%',
          height: '420',
          frameborder: '0',
          allowfullscreen: 'true',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          class: 'wvn-youtube-iframe',
        },
      ],
    ];
  },
});

// ---------- Helpers (used by the editor's paste/drop handlers) ----------

// Matches URLs that look like YouTube video links, captures the 11-char id.
const YOUTUBE_RE =
  /(?:https?:)?\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function extractYouTubeId(text) {
  if (!text) return null;
  const m = text.match(YOUTUBE_RE);
  return m ? m[1] : null;
}
