'use client';
// TipTap rich-text editor used in the story modal.
//
// Capabilities:
//   - Text formatting (bold, italic, H2, H3, lists, blockquote, link)
//   - Drag-and-drop images/videos → uploaded to Firebase Storage via
//     /api/stories/media, inserted at the drop position
//   - Paste an image URL, a media file, or a YouTube URL → handled automatically
//   - "Upload media" toolbar button for click-to-select
//   - YouTube URLs (watch, shorts, embed, youtu.be) auto-embed as iframes
//
// Emits HTML via onChange.

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useState } from 'react';
import { Video, YouTube, extractYouTubeId } from './tiptap-extensions';

async function uploadMedia(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/stories/media', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data; // { kind, url, name, size, contentType }
}

export default function StoryEditor({ initialContent = '', onChange, autoFocus = true }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(null); // null | { name, kind }
  const [error, setError] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-brand-700 underline' } }),
      Image,
      Video,
      YouTube,
      Placeholder.configure({ placeholder: 'Write your story… or drop photos/videos here.' }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[400px] focus:outline-none px-5 py-4',
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false; // moving existing content, not a new drop
        const files = Array.from(event.dataTransfer?.files || []);
        if (!files.length) return false;

        event.preventDefault();
        handleFiles(files);
        return true;
      },
      handlePaste(view, event) {
        // 1) Image/video pasted as a file
        const items = Array.from(event.clipboardData?.files || []);
        if (items.length) {
          event.preventDefault();
          handleFiles(items);
          return true;
        }
        // 2) YouTube URL pasted as text
        const text = event.clipboardData?.getData('text/plain');
        const ytId = extractYouTubeId(text);
        if (ytId) {
          event.preventDefault();
          editor?.chain().focus().insertContent({
            type: 'youtube',
            attrs: { videoId: ytId, url: text.trim() },
          }).run();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    immediatelyRender: false,
  });

  async function handleFiles(files) {
    setError(null);
    for (const file of files) {
      const kind = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
        : null;
      if (!kind) {
        setError(`Unsupported file type: ${file.type || 'unknown'}`);
        continue;
      }
      setUploading({ name: file.name, kind });
      try {
        const data = await uploadMedia(file);
        if (data.kind === 'image') {
          editor?.chain().focus().setImage({ src: data.url, alt: file.name }).run();
        } else {
          editor?.chain().focus().insertContent({
            type: 'video',
            attrs: { src: data.url },
          }).run();
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setUploading(null);
      }
    }
  }

  function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length) handleFiles(files);
    e.target.value = ''; // reset so the same file can be picked again
  }

  async function askYouTube() {
    const url = window.prompt('Paste a YouTube URL');
    if (!url) return;
    const id = extractYouTubeId(url);
    if (!id) { setError('Could not parse that as a YouTube URL.'); return; }
    editor?.chain().focus().insertContent({
      type: 'youtube',
      attrs: { videoId: id, url: url.trim() },
    }).run();
  }

  useEffect(() => {
    if (autoFocus && editor) editor.commands.focus();
  }, [editor, autoFocus]);

  // Sync external initialContent changes into the editor after mount.
  // TipTap's useEditor only reads `content` once; when the parent populates
  // the body later (AI-generated draft, cluster-seeded auto-generate,
  // version-tab switch, etc.), we push it in explicitly.
  //
  // The `initialContent === editor.getHTML()` short-circuit prevents the
  // onUpdate → onChange → parent update → re-render → effect loop. Passing
  // `false` as the second arg to setContent also suppresses onUpdate so
  // programmatic updates don't bubble back up as user edits.
  useEffect(() => {
    if (!editor) return;
    if (initialContent === editor.getHTML()) return;
    editor.commands.setContent(initialContent || '', false);
  }, [editor, initialContent]);

  if (!editor) return <div className="border border-ink-200 rounded-lg min-h-[400px] bg-ink-50/40 animate-pulse" />;

  return (
    <div className="border border-ink-200 rounded-lg bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-ink-100 bg-ink-50/50">
        <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>B</TB>
        <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><span className="italic">I</span></TB>
        <Sep />
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>H2</TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>H3</TB>
        <Sep />
        <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>• List</TB>
        <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>1. List</TB>
        <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>“ Quote</TB>
        <Sep />
        <TB onClick={() => {
          const url = window.prompt('URL', editor.getAttributes('link').href || 'https://');
          if (url === null) return;
          if (url === '') { editor.chain().focus().unsetLink().run(); return; }
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }} active={editor.isActive('link')}>🔗 Link</TB>
        <TB onClick={() => fileInputRef.current?.click()}>📷 Photo / Video</TB>
        <TB onClick={askYouTube}>🎬 YouTube</TB>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={onPickFiles} />
        <Sep />
        <TB onClick={() => editor.chain().focus().undo().run()}>↶</TB>
        <TB onClick={() => editor.chain().focus().redo().run()}>↷</TB>
        <div className="ml-auto self-center text-[11px] text-ink-500 px-2">
          {editor.getText().length} chars
        </div>
      </div>

      {/* Upload / error status */}
      {(uploading || error) && (
        <div className={`px-4 py-2 text-xs ${error ? 'bg-red-50 text-red-800 border-b border-red-200' : 'bg-blue-50 text-blue-800 border-b border-blue-200'}`}>
          {error ? (
            <>❌ {error} <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button></>
          ) : (
            <>⏳ Uploading {uploading.kind}: {uploading.name}…</>
          )}
        </div>
      )}

      {/* Drop hint when empty */}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function TB({ children, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-sm font-semibold rounded ${
        active ? 'bg-brand-700 text-white' : 'text-ink-700 hover:bg-ink-200'
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px bg-ink-200 mx-1 self-stretch" />;
}
