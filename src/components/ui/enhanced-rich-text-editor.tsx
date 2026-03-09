"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeaderCell from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import CharacterCount from "@tiptap/extension-character-count";
import { Button } from "./button";
import { Separator } from "./separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  ExternalLink,
  Table as TableIcon,
  Undo,
  Redo,
  Palette,
} from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { FontSize } from "./font-size-extension";

function ToolbarButton(props: {
  tooltip: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={props.active ? "default" : "ghost"}
            size="sm"
            onMouseDown={(e) => {
              e.preventDefault();
              props.onClick();
            }}
            onClick={(e) => e.preventDefault()}
            disabled={props.disabled}
            className="h-8 w-8 p-0"
          >
            {props.children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {props.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Doc as YDoc } from "yjs";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  isLoading?: boolean;
  lastSaved?: Date | null;
  ydoc?: YDoc;
  provider?: HocuspocusProvider | null;
  userName?: string;
  userColor?: string;
  editable?: boolean;
}

const FONT_SIZES = [
  { label: "Small", value: "12px" },
  { label: "Normal", value: "14px" },
  { label: "Medium", value: "16px" },
  { label: "Large", value: "18px" },
  { label: "Extra Large", value: "24px" },
  { label: "Huge", value: "32px" },
];

const COLORS = [
  "#000000",
  "#333333",
  "#666666",
  "#999999",
  "#cccccc",
  "#ffffff",
  "#ff0000",
  "#ff6600",
  "#ffcc00",
  "#66ff00",
  "#00ff66",
  "#00ffcc",
  "#0066ff",
  "#6600ff",
  "#cc00ff",
  "#ff0066",
  "#ff3366",
  "#66ccff",
];

const HIGHLIGHT_COLORS = [
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#ff00ff",
  "#ffa500",
  "#ff69b4",
  "#98fb98",
  "#87ceeb",
  "#dda0dd",
  "#f0e68c",
  "#ffd700",
  "#ff6347",
];

export function RichTextEditor(props: RichTextEditorProps) {
  const isCollab = !!props.ydoc;
  const isEditable = props.editable !== false;

  const editor = useEditor({
    immediatelyRender: false,
    editable: isEditable,
    extensions: [
      StarterKit.configure({
        history: isCollab ? false : undefined,
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      ...(props.ydoc
        ? [
            Collaboration.configure({ document: props.ydoc }),
            ...(props.provider
              ? [
                  CollaborationCursor.configure({
                    provider: props.provider,
                    user: {
                      name: props.userName || "Anonymous",
                      color: props.userColor || "#ff6b6b",
                    },
                  }),
                ]
              : []),
          ]
        : []),
      TextStyle,
      FontSize,
      Color,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer",
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeaderCell,
      TableCell,
      CharacterCount,
    ],
    content: props.content || undefined,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4 max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      props.onChange(editor.getHTML());
    },
  }, [props.provider]);

  useEffect(() => {
    if (!isCollab && editor && props.content !== editor.getHTML()) {
      editor.commands.setContent(props.content);
    }
  }, [props.content, editor, isCollab]);

  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);

  const openLinkPopover = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setLinkPopoverOpen(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const href = linkUrl.match(/^https?:\/\//) ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }

    setLinkPopoverOpen(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkPopoverOpen(false);
    setLinkUrl("");
  }, [editor]);

  const addTable = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const setAlignForCurrentBlock = useCallback((alignment: string) => {
    if (!editor) return;
    const { view, state } = editor;

    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) return;

    let domNode: Node | null = domSelection.anchorNode;
    let blockEl: HTMLElement | null = null;
    while (domNode && domNode !== view.dom) {
      if (domNode instanceof HTMLElement) {
        const tag = domNode.tagName;
        if (tag === "P" || /^H[1-6]$/.test(tag)) {
          blockEl = domNode;
          break;
        }
      }
      domNode = domNode.parentNode;
    }
    if (!blockEl) return;

    const pmPos = view.posAtDOM(blockEl, 0);
    const $pos = state.doc.resolve(pmPos);
    for (let depth = $pos.depth; depth > 0; depth--) {
      const node = $pos.node(depth);
      if (node.type.name === "paragraph" || node.type.name === "heading") {
        const pos = $pos.before(depth);
        view.dispatch(
          state.tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            textAlign: alignment,
          })
        );
        return;
      }
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-lg ${props.className}`}>
      {/* Main Toolbar */}
      {isEditable && (
      <div className="border-b p-2 flex flex-wrap items-center gap-1 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Undo/Redo */}
        <ToolbarButton tooltip="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton tooltip="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6" />

        {/* Font Size */}
        <Select
          value={editor.getAttributes("textStyle").fontSize || "14px"}
          onValueChange={(value: string) => {
            if (value === "14px") {
              editor.chain().focus().unsetFontSize().run();
            } else {
              editor.chain().focus().setFontSize(value).run();
            }
          }}
        >
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Formatting */}
        <ToolbarButton tooltip="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton tooltip="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton tooltip="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton tooltip="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Color */}
        <Popover>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Palette className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <TooltipContent side="bottom" className="text-xs">Text Color</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-6 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              Reset Color
            </Button>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive("highlight") ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <TooltipContent side="bottom" className="text-xs">Highlight</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-6 gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() =>
                    editor.chain().focus().toggleHighlight({ color }).run()
                  }
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
            >
              Remove Highlight
            </Button>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Alignment */}
        <ToolbarButton tooltip="Align Left" onClick={() => setAlignForCurrentBlock("left")} active={editor.isActive({ textAlign: "left" })}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton tooltip="Align Center" onClick={() => setAlignForCurrentBlock("center")} active={editor.isActive({ textAlign: "center" })}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton tooltip="Align Right" onClick={() => setAlignForCurrentBlock("right")} active={editor.isActive({ textAlign: "right" })}>
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <ToolbarButton tooltip="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton tooltip="Numbered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton tooltip="Task List" onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")}>
          <CheckSquare className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6" />

        {/* Other Features */}
        <ToolbarButton tooltip="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton tooltip="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive("link") ? "default" : "ghost"}
                    size="sm"
                    onClick={openLinkPopover}
                    className="h-8 w-8 p-0"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <TooltipContent side="bottom" className="text-xs">Insert Link</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Link URL</label>
              <div className="flex gap-2">
                <input
                  ref={linkInputRef}
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyLink();
                    }
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {editor.isActive("link") && (
                    <Button variant="ghost" size="sm" onClick={removeLink} className="text-destructive h-8 gap-1 px-2">
                      <Unlink className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  )}
                  {editor.isActive("link") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      onClick={() => {
                        const href = editor.getAttributes("link").href;
                        if (href) window.open(href, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </Button>
                  )}
                </div>
                <Button size="sm" onClick={applyLink} className="h-8">
                  {editor.isActive("link") ? "Update" : "Add"} Link
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <ToolbarButton tooltip="Insert Table" onClick={addTable}>
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>
      )}

      {/* Bubble Menu for selected text */}
      {isEditable && editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-1 p-2 bg-popover border border-border rounded-lg shadow-lg"
        >
          <ToolbarButton tooltip="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}>
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Highlight" onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")}>
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="Insert Link" onClick={openLinkPopover} active={editor.isActive("link")}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          {editor.isActive("link") && (
            <ToolbarButton tooltip="Remove Link" onClick={removeLink}>
              <Unlink className="h-4 w-4" />
            </ToolbarButton>
          )}
        </BubbleMenu>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} className="min-h-[500px]" />

      {/* Status Bar */}
      <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/20">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span>
              {editor.storage.characterCount?.characters() || 0} characters
            </span>
            <span>{editor.storage.characterCount?.words() || 0} words</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span>Rich Text Editor • Auto-save enabled</span>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }

        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }

        .ProseMirror ul[data-type="taskList"] p {
          margin: 0;
        }

        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: center;
        }

        .ProseMirror ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-right: 0.5rem;
          user-select: none;
        }

        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }

        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
        }

        .ProseMirror table td,
        .ProseMirror table th {
          min-width: 1em;
          border: 2px solid #ced4da;
          padding: 3px 5px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }

        .ProseMirror table th {
          font-weight: bold;
          text-align: left;
          background-color: #f1f3f4;
        }

        .ProseMirror .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }

        .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #adf;
          pointer-events: none;
        }

        .ProseMirror.resize-cursor {
          cursor: ew-resize;
          cursor: col-resize;
        }

        /* Improved focus styles */
        .ProseMirror:focus {
          outline: none;
        }

        /* Better table styling */
        .ProseMirror table {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid hsl(var(--border));
        }

        .ProseMirror table td,
        .ProseMirror table th {
          border: 1px solid hsl(var(--border));
          padding: 8px 12px;
        }

        .ProseMirror table th {
          background-color: hsl(var(--muted));
          font-weight: 600;
        }

        /* Task list styling */
        .ProseMirror
          ul[data-type="taskList"]
          li[data-checked="true"]
          > div
          > p {
          color: hsl(var(--muted-foreground));
          text-decoration: line-through;
        }

        /* Link styling */
        .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }

        .ProseMirror a:hover {
          color: hsl(var(--primary)) / 0.8;
        }

        /* Blockquote styling */
        .ProseMirror blockquote {
          border-left: 4px solid hsl(var(--border));
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }

        /* Code styling */
        .ProseMirror code {
          background-color: hsl(var(--muted));
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }

        /* Horizontal rule styling */
        .ProseMirror hr {
          border: none;
          border-top: 2px solid hsl(var(--border));
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}
