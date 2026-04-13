"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FileTree, TreeItem } from "@/components/editor/FileTree";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { GitHubRepo } from "@/types/github";

interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  sha: string;
}

interface TreeApiResponse {
  tree?: TreeItem[];
  truncated?: boolean;
  error?: string;
}

interface FileApiResponse {
  content?: string;
  sha?: string;
  path?: string;
  error?: string;
}

interface SaveApiResponse {
  sha?: string;
  path?: string;
  commitUrl?: string | null;
  error?: string;
}

const MAX_TABS = 5;

export function CodeEditorMode({ repo }: { repo: GitHubRepo }) {
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [loadingFilePath, setLoadingFilePath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const parts = repo.full_name.split("/");
  const owner = parts[0] ?? "";
  const repoName = parts[1] ?? "";

  const loadTree = useCallback(async () => {
    setIsLoadingTree(true);
    try {
      const params = new URLSearchParams({
        owner,
        repo: repoName,
        branch: repo.default_branch,
      });
      const response = await fetch(`/api/tree?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as TreeApiResponse;

      if (!response.ok || !payload.tree) {
        throw new Error(payload.error ?? "Failed to load file tree.");
      }

      setTree(payload.tree.filter((item) => item.type === "blob"));

      if (payload.truncated) {
        toast.warning("File tree is large — some files may not be listed.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load file tree.");
    } finally {
      setIsLoadingTree(false);
    }
  }, [owner, repoName, repo.default_branch]);

  useEffect(() => {
    void loadTree();
    // Reset editor state when repo changes
    setOpenFiles([]);
    setActiveFilePath(null);
  }, [loadTree]);

  const handleFileSelect = useCallback(
    async (path: string) => {
      const already = openFiles.find((f) => f.path === path);
      if (already) {
        setActiveFilePath(path);
        return;
      }

      if (openFiles.length >= MAX_TABS) {
        toast.warning("Maximum 5 tabs open. Close a tab before opening another.");
        return;
      }

      setLoadingFilePath(path);
      try {
        const params = new URLSearchParams({
          owner,
          repo: repoName,
          path,
          ref: repo.default_branch,
        });
        const response = await fetch(`/api/file?${params.toString()}`, { cache: "no-store" });
        const payload = (await response.json()) as FileApiResponse;

        if (!response.ok || payload.content === undefined) {
          throw new Error(payload.error ?? "Failed to load file.");
        }

        const newFile: OpenFile = {
          path,
          content: payload.content,
          originalContent: payload.content,
          sha: payload.sha ?? "",
        };

        setOpenFiles((prev) => [...prev, newFile]);
        setActiveFilePath(path);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to open file.");
      } finally {
        setLoadingFilePath(null);
      }
    },
    [openFiles, owner, repoName, repo.default_branch],
  );

  function handleTabClose(path: string) {
    const file = openFiles.find((f) => f.path === path);
    if (file && file.content !== file.originalContent) {
      if (!window.confirm(`${path} has unsaved changes. Close anyway?`)) {
        return;
      }
    }

    setOpenFiles((prev) => prev.filter((f) => f.path !== path));
    setActiveFilePath((prev) => {
      if (prev !== path) return prev;
      const remaining = openFiles.filter((f) => f.path !== path);
      return remaining[remaining.length - 1]?.path ?? null;
    });
  }

  function handleContentChange(path: string, value: string) {
    setOpenFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content: value } : f)),
    );
  }

  async function handleSave(path: string) {
    const file = openFiles.find((f) => f.path === path);
    if (!file) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/file", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo: repoName,
          path: file.path,
          content: file.content,
          sha: file.sha,
          branch: repo.default_branch,
        }),
      });

      const payload = (await response.json()) as SaveApiResponse;

      if (!response.ok || !payload.sha) {
        throw new Error(payload.error ?? "Failed to save file.");
      }

      setOpenFiles((prev) =>
        prev.map((f) =>
          f.path === path
            ? { ...f, originalContent: f.content, sha: payload.sha ?? f.sha }
            : f,
        ),
      );

      toast.success(`Saved ${path.split("/").pop()}`);

      if (payload.commitUrl) {
        window.open(payload.commitUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  const activeFile = openFiles.find((f) => f.path === activeFilePath) ?? null;
  const openTabs = openFiles.map((f) => f.path);

  return (
    <div className="grid h-[700px] gap-0 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 lg:grid-cols-[260px_1fr]">
      <aside className="flex flex-col overflow-hidden border-r border-slate-800">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Files
          </p>
          {isLoadingTree && <Loader2 className="size-3.5 animate-spin text-slate-500" />}
        </div>

        {isLoadingTree && openFiles.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-slate-500" />
          </div>
        ) : tree.length === 0 && !isLoadingTree ? (
          <p className="p-4 text-xs text-slate-500">No files found.</p>
        ) : (
          <FileTree
            items={tree}
            selectedPath={activeFilePath}
            openTabs={openTabs}
            onFileSelect={(path) => void handleFileSelect(path)}
            onTabClose={handleTabClose}
          />
        )}
      </aside>

      <main className="flex flex-col overflow-hidden">
        {loadingFilePath ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="size-4 animate-spin" />
            Loading {loadingFilePath.split("/").pop()}…
          </div>
        ) : activeFile ? (
          <CodeEditor
            path={activeFile.path}
            content={activeFile.content}
            isDirty={activeFile.content !== activeFile.originalContent}
            isSaving={isSaving}
            onChange={(value) => handleContentChange(activeFile.path, value)}
            onSave={() => void handleSave(activeFile.path)}
            repoHtmlUrl={repo.html_url}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-slate-500">
            <p>Select a file from the tree to start editing.</p>
            <p className="text-xs text-slate-600">
              Tip: Use Ctrl+S / ⌘S to save, Tab to indent.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
