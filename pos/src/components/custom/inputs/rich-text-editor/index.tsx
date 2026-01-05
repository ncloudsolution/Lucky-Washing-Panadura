"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";

import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import MenuBar from "./menu-bar";

interface RichTextEditorProps {
  content: string;
  onChange?: (content: string) => void;
  editable?: boolean;
}
export default function RichTextEditor({
  content,
  onChange,
  editable,
}: RichTextEditorProps) {
  const isEditable = editable ?? true;

  const CustomHighlight = Highlight.configure({
    multicolor: true, // allow multiple highlight colors
    HTMLAttributes: {
      style: `
          background-color: var(--color-superbase);
          color: #000000;
          padding: 4px 8px;  
          border-radius: 5px;   
        `,
    },
  });

  const editor = useEditor({
    editable: isEditable,
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-3",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-3",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      CustomHighlight,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: isEditable
          ? "border border-input min-h-40 break-words whitespace-normal focus:shadow focus:border-superbase border rounded-sm dark:bg-input/30 bg-transparent py-2 px-3 outline-none"
          : "",
      },
    },
    onUpdate: ({ editor }) => {
      // console.log(editor.getHTML());
      if (onChange) onChange(editor.getHTML());
    },
    immediatelyRender: false, // 🚀 prevents hydration mismatch
  });

  return (
    <div>
      {isEditable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
