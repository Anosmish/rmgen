"use client";

import { useState } from "react";
import { File, Folder, FolderOpen, X } from "lucide-react";

export interface TreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: "blob" | "tree";
  children: TreeNode[];
}

function buildTree(items: TreeItem[]): TreeNode[] {
  const root: TreeNode[] = [];

  const sorted = [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const item of sorted) {
    const parts = item.path.split("/");
    let nodes = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      const isLast = i === parts.length - 1;
      const existing = nodes.find((n) => n.name === part);

      if (existing) {
        nodes = existing.children;
      } else {
        const node: TreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          type: isLast ? item.type : "tree",
          children: [],
        };
        nodes.push(node);
        nodes = node.children;
      }
    }
  }

  return root;
}

interface TreeNodeProps {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onFileSelect: (path: string) => void;
}

function TreeNodeRow({ node, depth, selectedPath, onFileSelect }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 1);

  const isSelected = node.path === selectedPath;
  const isFolder = node.type === "tree";

  function handleClick() {
    if (isFolder) {
      setIsOpen((prev) => !prev);
    } else {
      onFileSelect(node.path);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={[
          "flex w-full items-center gap-1.5 rounded-sm py-0.5 pr-2 text-left text-xs text-slate-300 transition-colors",
          isSelected
            ? "border-l-2 border-cyan-400 bg-cyan-950 pl-[calc(0.5rem*var(--depth)+0.25rem)] text-cyan-100"
            : "border-l-2 border-transparent pl-[calc(0.5rem*var(--depth)+0.25rem)] hover:bg-slate-800",
        ].join(" ")}
        style={{ "--depth": depth } as React.CSSProperties}
      >
        {isFolder ? (
          isOpen ? (
            <FolderOpen className="size-3.5 shrink-0 text-cyan-400" />
          ) : (
            <Folder className="size-3.5 shrink-0 text-slate-400" />
          )
        ) : (
          <File className="size-3.5 shrink-0 text-slate-500" />
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {isFolder && isOpen && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const MAX_TABS = 5;

interface FileTreeProps {
  items: TreeItem[];
  selectedPath: string | null;
  openTabs: string[];
  onFileSelect: (path: string) => void;
  onTabClose: (path: string) => void;
}

export function FileTree({ items, selectedPath, openTabs, onFileSelect, onTabClose }: FileTreeProps) {
  const tree = buildTree(items);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {openTabs.length > 0 && (
        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-700 bg-slate-950/60 px-2 py-1.5 scrollbar-none">
          {openTabs.slice(0, MAX_TABS).map((tab) => {
            const fileName = tab.split("/").pop() ?? tab;
            const isActive = tab === selectedPath;
            return (
              <div
                key={tab}
                className={[
                  "group flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors",
                  isActive
                    ? "bg-cyan-950 text-cyan-100 ring-1 ring-cyan-400/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => onFileSelect(tab)}
                  className="max-w-[120px] truncate"
                  title={tab}
                >
                  {fileName}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab);
                  }}
                  className="rounded p-0.5 opacity-50 hover:opacity-100 focus-visible:outline-none"
                  aria-label={`Close ${fileName}`}
                >
                  <X className="size-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {tree.map((node) => (
          <TreeNodeRow
            key={node.path}
            node={node}
            depth={0}
            selectedPath={selectedPath}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
}
