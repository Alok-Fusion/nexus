"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  GripVertical,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Code,
  Quote,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Minus,
  Sparkles,
  Copy,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { BlockItem, PageDetail, api } from "@/lib/api";

interface DocumentEditorProps {
  page: PageDetail;
  onPageTitleChange: (newTitle: string) => void;
  onOpenAI: () => void;
}

export function DocumentEditor({ page, onPageTitleChange, onOpenAI }: DocumentEditorProps) {
  const [blocks, setBlocks] = useState<BlockItem[]>(page.blocks || []);
  const [title, setTitle] = useState(page.title);
  const [icon, setIcon] = useState(page.icon || "📄");
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Error">("Saved");
  
  // Slash menu state
  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    blockId: string | null;
    query: string;
    selectedIndex: number;
  }>({
    isOpen: false,
    blockId: null,
    query: "",
    selectedIndex: 0,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setBlocks(page.blocks || []);
    setTitle(page.title);
    setIcon(page.icon || "📄");
  }, [page.id]);

  // Debounced autosave
  const triggerAutosave = (updatedBlocks: BlockItem[]) => {
    setSaveStatus("Saving...");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.syncBlocks(page.id, updatedBlocks);
        setSaveStatus("Saved");
      } catch (err) {
        console.error("Autosave failed", err);
        setSaveStatus("Error");
      }
    }, 600);
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onPageTitleChange(newTitle);
    setSaveStatus("Saving...");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.updatePage(page.id, { title: newTitle });
        setSaveStatus("Saved");
      } catch {
        setSaveStatus("Error");
      }
    }, 600);
  };

  const updateBlockContent = (blockId: string, text: string) => {
    const updated = blocks.map((b) => {
      if (b.id === blockId) {
        return {
          ...b,
          content: { ...b.content, text },
        };
      }
      return b;
    });
    setBlocks(updated);
    triggerAutosave(updated);
  };

  const updateBlockProperties = (blockId: string, properties: any) => {
    const updated = blocks.map((b) => {
      if (b.id === blockId) {
        return {
          ...b,
          properties: { ...b.properties, ...properties },
        };
      }
      return b;
    });
    setBlocks(updated);
    triggerAutosave(updated);
  };

  const addBlockBelow = async (currentBlockId?: string, type: string = "paragraph") => {
    const currentIndex = currentBlockId ? blocks.findIndex((b) => b.id === currentBlockId) : blocks.length - 1;
    const prevPos = currentIndex >= 0 ? blocks[currentIndex].position : undefined;
    const nextPos = currentIndex >= 0 && currentIndex + 1 < blocks.length ? blocks[currentIndex + 1].position : undefined;

    try {
      const newBlock = await api.createBlock(page.id, { type, content: { text: "" }, properties: {} }, prevPos, nextPos);
      const newBlocks = [...blocks];
      newBlocks.splice(currentIndex + 1, 0, newBlock);
      setBlocks(newBlocks);
      
      setTimeout(() => {
        const el = document.getElementById(`block-input-${newBlock.id}`);
        el?.focus();
      }, 50);
    } catch (err) {
      console.error("Failed to add block", err);
    }
  };

  const deleteBlock = async (blockId: string) => {
    if (blocks.length <= 1) return; // Keep at least one block
    const newBlocks = blocks.filter((b) => b.id !== blockId);
    setBlocks(newBlocks);
    try {
      await api.deleteBlock(blockId);
      setSaveStatus("Saved");
    } catch (err) {
      console.error("Delete block failed", err);
    }
  };

  const changeBlockType = (blockId: string, newType: string) => {
    const updated = blocks.map((b) => {
      if (b.id === blockId) {
        return {
          ...b,
          type: newType,
          properties: newType === "todo" ? { checked: false } : b.properties,
        };
      }
      return b;
    });
    setBlocks(updated);
    setSlashMenu({ isOpen: false, blockId: null, query: "", selectedIndex: 0 });
    triggerAutosave(updated);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === blocks.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);

    setBlocks(newBlocks);
    triggerAutosave(newBlocks);
  };

  // Slash commands catalog
  const slashOptions = [
    { type: "paragraph", label: "Text", icon: Type, desc: "Plain text paragraph" },
    { type: "heading_1", label: "Heading 1", icon: Heading1, desc: "Large section header" },
    { type: "heading_2", label: "Heading 2", icon: Heading2, desc: "Medium subsection header" },
    { type: "heading_3", label: "Heading 3", icon: Heading3, desc: "Small group header" },
    { type: "todo", label: "To-do List", icon: CheckSquare, desc: "Track actionable tasks" },
    { type: "toggle", label: "Toggle List", icon: ChevronRight, desc: "Collapsible content toggle" },
    { type: "quote", label: "Quote", icon: Quote, desc: "Capture quotes or ideas" },
    { type: "callout", label: "Callout", icon: AlertCircle, desc: "Highlight important notes" },
    { type: "code", label: "Code Block", icon: Code, desc: "Monospace code block" },
    { type: "divider", label: "Divider", icon: Minus, desc: "Visual horizontal divider" },
  ];

  const filteredSlashOptions = slashOptions.filter(
    (o) => o.label.toLowerCase().includes(slashMenu.query.toLowerCase()) || o.type.includes(slashMenu.query.toLowerCase())
  );

  const renderBlockContent = (block: BlockItem, index: number) => {
    const text = block.content.text || "";

    switch (block.type) {
      case "heading_1":
        return (
          <input
            id={`block-input-${block.id}`}
            type="text"
            value={text}
            onChange={(e) => updateBlockContent(block.id, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, block, index)}
            placeholder="Heading 1"
            className="w-full bg-transparent text-2xl font-bold text-foreground placeholder-muted-foreground/50 outline-none"
          />
        );
      case "heading_2":
        return (
          <input
            id={`block-input-${block.id}`}
            type="text"
            value={text}
            onChange={(e) => updateBlockContent(block.id, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, block, index)}
            placeholder="Heading 2"
            className="w-full bg-transparent text-xl font-semibold text-foreground placeholder-muted-foreground/50 outline-none"
          />
        );
      case "heading_3":
        return (
          <input
            id={`block-input-${block.id}`}
            type="text"
            value={text}
            onChange={(e) => updateBlockContent(block.id, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, block, index)}
            placeholder="Heading 3"
            className="w-full bg-transparent text-lg font-medium text-foreground placeholder-muted-foreground/50 outline-none"
          />
        );
      case "todo":
        const isChecked = !!block.properties.checked;
        return (
          <div className="flex items-center space-x-2.5 w-full">
            <button
              onClick={() => updateBlockProperties(block.id, { checked: !isChecked })}
              className="text-muted-foreground hover:text-brand transition-colors mt-0.5"
            >
              {isChecked ? <CheckSquare size={16} className="text-brand" /> : <Square size={16} />}
            </button>
            <input
              id={`block-input-${block.id}`}
              type="text"
              value={text}
              onChange={(e) => updateBlockContent(block.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, block, index)}
              placeholder="To-do task..."
              className={`w-full bg-transparent text-sm text-foreground placeholder-muted-foreground/50 outline-none ${
                isChecked ? "line-through text-muted-foreground" : ""
              }`}
            />
          </div>
        );
      case "toggle":
        const isCollapsed = !!block.properties.collapsed;
        return (
          <div className="space-y-1.5 w-full">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => updateBlockProperties(block.id, { collapsed: !isCollapsed })}
                className="p-0.5 text-muted-foreground hover:text-foreground rounded"
              >
                {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
              </button>
              <input
                id={`block-input-${block.id}`}
                type="text"
                value={text}
                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block, index)}
                placeholder="Toggle header..."
                className="w-full bg-transparent text-sm font-semibold text-foreground placeholder-muted-foreground/50 outline-none"
              />
            </div>
            {!isCollapsed && (
              <div className="pl-6 border-l border-border/60 ml-2 py-1 text-xs text-muted-foreground">
                Nested toggle content supported.
              </div>
            )}
          </div>
        );
      case "callout":
        return (
          <div className="flex items-start space-x-3 w-full bg-surface-card/70 border border-brand/20 p-3 rounded-lg">
            <span className="text-base leading-none">💡</span>
            <input
              id={`block-input-${block.id}`}
              type="text"
              value={text}
              onChange={(e) => updateBlockContent(block.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, block, index)}
              placeholder="Callout note or key takeaway..."
              className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground/50 outline-none"
            />
          </div>
        );
      case "quote":
        return (
          <div className="flex items-start pl-3 border-l-2 border-brand w-full py-0.5">
            <input
              id={`block-input-${block.id}`}
              type="text"
              value={text}
              onChange={(e) => updateBlockContent(block.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, block, index)}
              placeholder="Empty quote..."
              className="w-full bg-transparent text-sm italic text-foreground placeholder-muted-foreground/50 outline-none"
            />
          </div>
        );
      case "code":
        return (
          <div className="w-full bg-surface-card rounded-lg border border-border p-3 font-mono text-xs text-foreground">
            <textarea
              id={`block-input-${block.id}`}
              rows={3}
              value={text}
              onChange={(e) => updateBlockContent(block.id, e.target.value)}
              placeholder="// Write code here..."
              className="w-full bg-transparent text-foreground placeholder-muted-foreground/50 outline-none resize-none font-mono"
            />
          </div>
        );
      case "divider":
        return <div className="w-full my-2 border-b border-border/80" />;
      default: // paragraph
        return (
          <input
            id={`block-input-${block.id}`}
            type="text"
            value={text}
            onChange={(e) => updateBlockContent(block.id, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, block, index)}
            placeholder="Type '/' for commands or start typing..."
            className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground/50 outline-none"
          />
        );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: BlockItem, index: number) => {
    if (e.key === "/" && (block.content.text || "") === "") {
      setSlashMenu({
        isOpen: true,
        blockId: block.id,
        query: "",
        selectedIndex: 0,
      });
    } else if (e.key === "Enter" && !e.shiftKey) {
      if (slashMenu.isOpen) {
        e.preventDefault();
        if (filteredSlashOptions[slashMenu.selectedIndex]) {
          changeBlockType(block.id, filteredSlashOptions[slashMenu.selectedIndex].type);
        }
      } else {
        e.preventDefault();
        addBlockBelow(block.id);
      }
    } else if (e.key === "Backspace" && (block.content.text || "") === "" && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(block.id);
      const prevBlock = blocks[index - 1];
      if (prevBlock) {
        document.getElementById(`block-input-${prevBlock.id}`)?.focus();
      }
    } else if (e.key === "ArrowDown" && slashMenu.isOpen) {
      e.preventDefault();
      setSlashMenu((prev) => ({
        ...prev,
        selectedIndex: (prev.selectedIndex + 1) % filteredSlashOptions.length,
      }));
    } else if (e.key === "ArrowUp" && slashMenu.isOpen) {
      e.preventDefault();
      setSlashMenu((prev) => ({
        ...prev,
        selectedIndex: (prev.selectedIndex - 1 + filteredSlashOptions.length) % filteredSlashOptions.length,
      }));
    } else if (e.key === "Escape" && slashMenu.isOpen) {
      setSlashMenu({ isOpen: false, blockId: null, query: "", selectedIndex: 0 });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-10 py-12 min-h-screen relative">
      {/* Header Metadata & Autosave Indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-8">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-foreground">Document Canvas</span>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`flex items-center space-x-1 text-[11px] font-medium ${
              saveStatus === "Saved" ? "text-emerald-500" : saveStatus === "Saving..." ? "text-amber-500" : "text-rose-500"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>{saveStatus}</span>
          </span>
          <button
            onClick={onOpenAI}
            className="flex items-center space-x-1 px-2.5 py-1 bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand rounded-md text-xs font-semibold transition-colors"
          >
            <Sparkles size={12} />
            <span>Page AI</span>
          </button>
        </div>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Page"
          className="w-full bg-transparent text-3xl font-extrabold text-foreground placeholder-muted-foreground/40 outline-none tracking-tight"
        />
      </div>

      {/* Blocks Canvas */}
      <div className="space-y-2 relative">
        {blocks.map((block, index) => (
          <div key={block.id} className="group relative flex items-start -ml-8 pl-8 py-0.5 rounded-md hover:bg-surface-hover/30 transition-colors">
            {/* Block Hover Actions (Drag Handle, Turn into, Delete) */}
            <div className="absolute left-0 top-1.5 opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 text-muted-foreground transition-opacity">
              <button
                onClick={() => addBlockBelow(block.id)}
                className="p-0.5 hover:bg-surface-card rounded hover:text-foreground"
                title="Add block below"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={() => moveBlock(index, "up")}
                className="p-0.5 hover:bg-surface-card rounded hover:text-foreground"
                title="Move up"
              >
                <ArrowUp size={12} />
              </button>
              <button
                onClick={() => moveBlock(index, "down")}
                className="p-0.5 hover:bg-surface-card rounded hover:text-foreground"
                title="Move down"
              >
                <ArrowDown size={12} />
              </button>
              <button
                onClick={() => deleteBlock(block.id)}
                className="p-0.5 hover:bg-surface-card rounded hover:text-rose-500"
                title="Delete block"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Block Content */}
            <div className="flex-1 min-w-0">{renderBlockContent(block, index)}</div>
          </div>
        ))}

        {/* Add Block Placeholder Button */}
        <button
          onClick={() => addBlockBelow()}
          className="flex items-center space-x-2 text-xs text-muted-foreground hover:text-foreground mt-4 px-2 py-1.5 rounded hover:bg-surface-hover/50 transition-colors"
        >
          <Plus size={14} />
          <span>Click to add a block or type '/'</span>
        </button>
      </div>

      {/* Slash Inserter Menu Dropdown */}
      {slashMenu.isOpen && (
        <div className="fixed z-50 bg-surface-popover border border-border rounded-xl shadow-2xl p-2 w-64 max-h-72 overflow-y-auto animate-fade-in">
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Turn Into Block
          </div>
          <div className="space-y-0.5 mt-1">
            {filteredSlashOptions.map((opt, idx) => {
              const Icon = opt.icon;
              const isSelected = slashMenu.selectedIndex === idx;
              return (
                <button
                  key={opt.type}
                  onClick={() => {
                    if (slashMenu.blockId) changeBlockType(slashMenu.blockId, opt.type);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                    isSelected ? "bg-brand text-brand-foreground font-semibold" : "hover:bg-surface-hover text-foreground"
                  }`}
                >
                  <Icon size={14} />
                  <div className="flex flex-col truncate">
                    <span className="font-medium">{opt.label}</span>
                    <span className={`text-[10px] font-normal truncate ${isSelected ? "text-brand-foreground/80" : "text-muted-foreground"}`}>
                      {opt.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
