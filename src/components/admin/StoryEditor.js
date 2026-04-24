'use client';
// TipTap-based rich-text editor used on /admin/stories/new and /[id]/edit.
// Emits HTML body string via the onChange callback so the server action can
// write it straight to Firestore.

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

export default function StoryEditor({ initialContent = '', onChange, autoFocus = true }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-brand-700 underline' } }),
      Image,
      Placeholder.configure({ placeholder: 'Write your story…' }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[400px] focus:outline-none px-5 py-4',
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    immediatelyRender: false, // avoids hydration mismatch in Next.js app router
  });

  useEffect(() => {
    if (autoFocus && editor) editor.commands.focus();
  }, [editor, autoFocus]);

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
        <TB onClick={() => {
          const url = window.prompt('Image URL');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}>🖼 Image</TB>
        <Sep />
        <TB onClick={() => editor.chain().focus().undo().run()}>↶</TB>
        <TB onClick={() => editor.chain().focus().redo().run()}>↷</TB>
        <div className="ml-auto self-center text-[11px] text-ink-500 px-2">
          {editor.storage.characterCount?.characters() || editor.getText().length} chars
        </div>
      </div>

      <EditorContent editor={editor} />
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
