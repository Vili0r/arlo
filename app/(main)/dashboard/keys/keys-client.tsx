"use client";

import { useState, useTransition } from "react";
import {
  Key,
  Copy,
  Check,
  Trash2,
  Plus,
  ChevronDown,
  Eye,
  MoreHorizontal,
  Search,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { createApiKey, deleteApiKey } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";


interface KeyData {
  id: string;
  name: string;
  prefix: string;
  environment: "DEVELOPMENT" | "PRODUCTION";
  lastUsedAt: string | null;
  createdAt: string;
  project: { id: string; name: string; iconUrl: string | null };
}

interface ProjectOption {
  id: string;
  name: string;
}

interface Props {
  keys: KeyData[];
  projects: ProjectOption[];
}

export default function KeysClient({ keys, projects }: Props) {
  // Filters
  const [envFilter, setEnvFilter] = useState<"ALL" | "DEVELOPMENT" | "PRODUCTION">("ALL");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Dropdowns
  const [envDropdown, setEnvDropdown] = useState(false);
  const [projectDropdown, setProjectDropdown] = useState(false);


  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEnv, setNewEnv] = useState<"DEVELOPMENT" | "PRODUCTION">("DEVELOPMENT");
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id ?? "");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<KeyData | null>(null);

  const filtered = keys.filter((k) => {
    if (envFilter !== "ALL" && k.environment !== envFilter) return false;
    if (projectFilter !== "ALL" && k.project.id !== projectFilter) return false;
    if (search && !k.name.toLowerCase().includes(search.toLowerCase()) && !k.prefix.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = () => {
    if (!newName.trim() || !newProjectId) return;
    startTransition(async () => {
      try {
        const result = await createApiKey(newProjectId, { name: newName, environment: newEnv });
        setRevealedKey(result.rawKey);
        setNewName("");
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteApiKey(deleteTarget.id);
        setDeleteTarget(null);

      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setRevealedKey(null);
    setNewName("");
    setCopied(false);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const prodCount = keys.filter((k) => k.environment === "PRODUCTION").length;
  const devCount = keys.filter((k) => k.environment === "DEVELOPMENT").length;

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-white">API Keys</h1>
          <p className="text-xs text-[#555] mt-0.5">
            {keys.length} key{keys.length !== 1 ? "s" : ""} across {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-[#e5e5e5] transition-colors"
        >
          <Plus size={14} />
          Create Key
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#141414] border border-[#1f1f1f] rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="text-[#444]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keys..."
            className="bg-transparent text-sm text-white placeholder:text-[#444] focus:outline-none flex-1"
          />
        </div>

        {/* Project filter */}
        <div className="relative">
          <button
            onClick={() => { setProjectDropdown(!projectDropdown); setEnvDropdown(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141414] border border-[#1f1f1f] text-sm text-[#888] hover:text-white hover:border-[#333] transition-colors"
          >
            {projectFilter === "ALL" ? "All Projects" : projects.find((p) => p.id === projectFilter)?.name}
            <ChevronDown size={13} />
          </button>
          {projectDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#141414] border border-[#1f1f1f] rounded-lg shadow-xl z-50 py-1">
              <button
                onClick={() => { setProjectFilter("ALL"); setProjectDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors ${projectFilter === "ALL" ? "text-white" : "text-[#888]"}`}
              >
                All Projects
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setProjectFilter(p.id); setProjectDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors ${projectFilter === p.id ? "text-white" : "text-[#888]"}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Environment filter */}
        <div className="relative">
          <button
            onClick={() => { setEnvDropdown(!envDropdown); setProjectDropdown(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141414] border border-[#1f1f1f] text-sm text-[#888] hover:text-white hover:border-[#333] transition-colors"
          >
            {envFilter === "ALL" ? "All Environments" : envFilter === "PRODUCTION" ? "Production" : "Development"}
            <ChevronDown size={13} />
          </button>
          {envDropdown && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-[#141414] border border-[#1f1f1f] rounded-lg shadow-xl z-50 py-1">
              {(["ALL", "PRODUCTION", "DEVELOPMENT"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setEnvFilter(opt); setEnvDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors ${envFilter === opt ? "text-white" : "text-[#888]"}`}
                >
                  {opt === "ALL" ? "All Environments" : opt === "PRODUCTION" ? "Production" : "Development"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#141414] border border-[#1f1f1f] text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[#888]">{prodCount}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#141414] border border-[#1f1f1f] text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-[#888]">{devCount}</span>
          </span>
          <span className="text-[11px] text-[#444] ml-1">
            {prodCount + devCount}/{keys.length}
          </span>
        </div>
      </div>

      {/* ── Keys List ── */}
      <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl hover:border-white/[0.15] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Key size={24} className="mx-auto text-[#333] mb-3" />
            <p className="text-sm text-[#555]">
              {keys.length === 0 ? "No API keys yet" : "No keys match your filters"}
            </p>
            {keys.length === 0 && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-[#e5e5e5] transition-colors mx-auto"
              >
                <Plus size={14} />
                Create Your First Key
              </button>
            )}
          </div>
        ) : (
          filtered.map((key, i) => (
            <div
              key={key.id}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group ${
                i !== filtered.length - 1 ? "border-b border-[#1a1a1a]" : ""
              }`}
            >
              {/* Left: name + prefix */}
              <div className="w-[220px] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{key.name}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-white/40">{key.environment === "PRODUCTION" ? "Production" : "Development"}</span>
                </div>
              </div>

              {/* Environment badge */}
              <div className="w-[100px] flex-shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    key.environment === "PRODUCTION"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-blue-400/10 text-blue-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      key.environment === "PRODUCTION" ? "bg-emerald-400" : "bg-blue-400"
                    }`}
                  />
                  {key.environment === "PRODUCTION" ? "Live" : "Test"}
                </span>
              </div>

              {/* Project */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/project/${key.project.id}`}
                  className="text-xs text-white/80 hover:text-white transition-colors truncate block"
                >
                  {key.project.name}
                </Link>
              </div>

              {/* Prefix (masked key) */}
              <div className="w-[180px] flex-shrink-0">
                <code className="text-[11px] font-mono text-white/40">
                  {key.prefix}••••••••
                </code>
              </div>

              {/* Timestamp */}
              <div className="w-[100px] flex-shrink-0 text-right">
                <span className="text-xs text-white/40">{timeAgo(key.createdAt)}</span>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger 
                  render={<div />}
                  nativeButton={false}
                >
                  <div role="button" className="p-1.5 rounded-lg text-[#333] hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none">
                    <MoreHorizontal size={16} />
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  side="bottom"
                  sideOffset={4}
                  className="w-48 bg-[#1a1a1e] border-white/[0.1] rounded-xl shadow-2xl p-1"
                >
                  <DropdownMenuItem
                    onClick={() => handleCopy(key.prefix)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 focus:text-white focus:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <Copy size={13} />
                    Copy Prefix
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      // Roll key logic
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 focus:text-white focus:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    Roll Key
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Link
                      href={`/dashboard/project/${key.project.id}`}
                      className="flex items-center gap-2.5 px-1.5 py-2 rounded-lg text-sm text-white/60 focus:text-white focus:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <ExternalLink size={13} />
                      View Project
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/[0.06] my-1" />

                  <DropdownMenuItem
                    onClick={() => setDeleteTarget(key)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 focus:text-red-300 focus:bg-red-400/[0.06] transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Revoke Key
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* ── Create Key Dialog ── */}
      <Dialog open={createOpen} onOpenChange={handleCloseCreate}>
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{revealedKey ? "Key Created" : "Create API Key"}</DialogTitle>
            <DialogDescription>
              {revealedKey
                ? "Copy this key now. You won't be able to see it again."
                : "Generate a new API key for SDK integration."}
            </DialogDescription>
          </DialogHeader>

          {revealedKey ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-[10px] font-semibold uppercase tracking-widest">
                  <Eye size={12} />
                  Your API Key
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-white flex-1 break-all select-all">
                    {revealedKey}
                  </code>
                  <button
                    onClick={() => handleCopy(revealedKey)}
                    className="p-1.5 rounded-md bg-[#1a1a1a] text-[#666] hover:text-white transition-colors flex-shrink-0"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-[#444] leading-relaxed">
                Store this key securely. It's hashed on our end and cannot be retrieved after closing.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">Project</label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] text-sm text-white focus:outline-none focus:border-[#333] appearance-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">Key Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder='e.g. "Production iOS"'
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#333]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">Environment</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["DEVELOPMENT", "PRODUCTION"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setNewEnv(option)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        newEnv === option
                          ? option === "PRODUCTION"
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                            : "border-blue-400/40 bg-blue-400/10 text-blue-400"
                          : "border-[#1f1f1f] bg-[#0a0a0a] text-[#555] hover:text-[#888] hover:border-[#333]"
                      }`}
                    >
                      {option === "PRODUCTION" ? "Production" : "Development"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {revealedKey ? (
              <button
                onClick={handleCloseCreate}
                className="px-5 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-[#e5e5e5] transition-colors"
              >
                Done
              </button>
            ) : (
              <>
                <button onClick={handleCloseCreate} className="px-4 py-2 text-sm text-[#555] hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isPending || !newName.trim() || !newProjectId}
                  className="px-5 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-[#e5e5e5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? "Generating..." : "Generate Key"}
                </button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] sm:max-sm">
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke <strong className="text-white">{deleteTarget?.name}</strong>? Any
              applications using this key will immediately lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-[#555] hover:text-white transition-colors">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-5 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-40"
            >
              {isPending ? "Revoking..." : "Revoke Key"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
