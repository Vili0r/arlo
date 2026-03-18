"use client";

import { useState, useTransition } from "react";
import { Key, ArrowRight, Plus, Copy, Check, Trash2, Eye, EyeOff } from "lucide-react";
import { createApiKey, deleteApiKey } from "@/app/(main)/dashboard/project/[id]/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ApiKeyData {
  id: string;
  name: string;
  prefix: string;
  environment: "DEVELOPMENT" | "PRODUCTION";
  lastUsedAt: string | null;
  createdAt: string;
}

interface ApiKeysCardProps {
  projectId: string;
  apiKeys: ApiKeyData[];
}

export function ApiKeysCard({ projectId, apiKeys }: ApiKeysCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [name, setName] = useState("");
  const [env, setEnv] = useState<"DEVELOPMENT" | "PRODUCTION">("DEVELOPMENT");
  const [isPending, startTransition] = useTransition();
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        const result = await createApiKey(projectId, { name, environment: env });
        setRevealedKey(result.rawKey);
        setName("");
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (keyId: string) => {
    startTransition(async () => {
      try {
        await deleteApiKey(projectId, keyId);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleCloseCreate = () => {
    setDialogOpen(false);
    setRevealedKey(null);
    setName("");
    setCopied(false);
  };

  return (
    <>
      {/* ── Summary Card (right column) ── */}
      <section
        onClick={() => setListOpen(true)}
        className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.15] transition-all duration-200 group hover:bg-white/[0.04] cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">API Access</h3>
          <span className="p-1.5 rounded-lg text-[#444] group-hover:text-white transition-colors">
            <ArrowRight size={14} />
          </span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#1f1f1f] flex items-center justify-center">
            <Key size={16} className="text-blue-400/80" />
          </div>
          <div>
            <span className="text-xl font-bold text-white leading-none">
              {apiKeys.length}
            </span>
            <span className="text-xs text-[#555] ml-1.5">active keys</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0a0a] border border-[#1f1f1f] text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[#888]">
              {apiKeys.filter((k) => k.environment === "PRODUCTION").length} Production
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0a0a] border border-[#1f1f1f] text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-[#888]">
              {apiKeys.filter((k) => k.environment === "DEVELOPMENT").length} Development
            </span>
          </span>
        </div>
      </section>

      {/* ── Keys List Dialog ── */}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API Keys</DialogTitle>
            <DialogDescription>
              Manage API keys for this project. Keys are hashed after creation and
              cannot be viewed again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key size={20} className="mx-auto text-[#333] mb-3" />
                <p className="text-sm text-[#555]">No API keys yet</p>
                <p className="text-xs text-[#333] mt-1">
                  Create one to connect your app.
                </p>
              </div>
            ) : (
              apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] group/key"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {key.name}
                      </span>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          key.environment === "PRODUCTION"
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-blue-400/10 text-blue-400"
                        }`}
                      >
                        {key.environment === "PRODUCTION" ? "Prod" : "Dev"}
                      </span>
                    </div>
                    <code className="text-[11px] font-mono text-[#444] mt-0.5 block">
                      {key.prefix}••••••••
                    </code>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(key.prefix);
                    }}
                    className="p-1.5 text-[#333] hover:text-[#888] transition-colors"
                    title="Copy prefix"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(key.id);
                    }}
                    className="p-1.5 text-[#333] hover:text-red-400 transition-colors opacity-0 group-hover/key:opacity-100"
                    title="Revoke key"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setListOpen(false);
                setDialogOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-[#e5e5e5] transition-colors"
            >
              <Plus size={14} />
              Create Key
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Key Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseCreate}>
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {revealedKey ? "Key Created" : "Create API Key"}
            </DialogTitle>
            <DialogDescription>
              {revealedKey
                ? "Copy this key now. You won't be able to see it again."
                : "Generate a new API key for your SDK integration."}
            </DialogDescription>
          </DialogHeader>

          {revealedKey ? (
            /* ── Reveal screen ── */
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
                Store this key securely. It's hashed on our end and cannot be
                retrieved after you close this dialog.
              </p>
            </div>
          ) : (
            /* ── Form ── */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                  Key Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='e.g. "Production iOS" or "Dev Testing"'
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#333]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                  Environment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["DEVELOPMENT", "PRODUCTION"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setEnv(option)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        env === option
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
                <button
                  onClick={handleCloseCreate}
                  className="px-4 py-2 text-sm text-[#555] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isPending || !name.trim()}
                  className="px-5 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-[#e5e5e5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? "Generating..." : "Generate Key"}
                </button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}