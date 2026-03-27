import React from "react";
import { getProject } from "../actions";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  Settings,
  Layers,
  Key,
  History,
  Github,
  Undo2,
  Copy,
  Plus,
  ArrowRight,
  Rocket,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { CreateFlowButton } from "@/app/(main)/dashboard/project/[id]/_components/create-flow-dialog";
import { FlowsCard } from "@/app/(main)/dashboard/project/[id]/_components/flows-card";
import { ApiKeysCard } from "@/app/(main)/dashboard/key/_components/api-keys-card";
import { PlacementsCard } from "@/app/(main)/dashboard/project/[id]/_components/placements-card";
import { RegistryKeysCard } from "@/app/(main)/dashboard/project/[id]/_components/registry-keys-card";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  let project;

  try {
    project = await getProject(id);
  } catch (error) {
    notFound();
  }

  const placements = project.placements ?? [];
  const registryKeys = project.registryKeys ?? [];
  const flowCount = project.flows.length;
  const keyCount = project.apiKeys.length;
  const publishedFlows = project.flows.filter((f) => f.status === "PUBLISHED");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-8 pb-16">

        {/* ── Top Bar: Search + Actions ── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 bg-[#141414] border border-[#1f1f1f] rounded-xl px-4 py-2.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#555]"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="text-sm text-[#555]">Search in project...</span>
          </div>
          <Link
            href="#"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] border border-[#1f1f1f] text-sm text-[#888] hover:text-white hover:border-[#333] transition-colors"
          >
            <ExternalLink size={14} />
            SDK Docs
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] border border-[#1f1f1f] text-sm text-[#888] hover:text-white hover:border-[#333] transition-colors"
          >
            <Settings size={14} />
            Settings
          </Link>
        </div>

        {/* ── Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* ── Left Column ── */}
          <div className="flex flex-col gap-6">

            {/* Project Identity Card */}
            <section className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
              <div className="flex items-center gap-4">
                {project.iconUrl ? (
                  <div className="w-11 h-11 rounded-lg overflow-hidden border border-[#1f1f1f] bg-[#0a0a0a] flex-shrink-0">
                    <Image
                      src={project.iconUrl}
                      alt={project.name}
                      width={44}
                      height={44}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                    <span className="text-black font-bold text-lg leading-none">
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-lg font-semibold text-white truncate">
                      {project.name}
                    </h1>
                    <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider">
                      {project.platform.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-[#555] mt-0.5">
                    <code className="text-[11px] font-mono text-[#666]">
                      {project.id}
                    </code>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] text-[10px] font-semibold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400">Active</span>
                </div>
              </div>
            </section>

            {/* Quick Start / SDK Card */}
            <section className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="p-5 space-y-5">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Project Infrastructure
                  </h2>
                  <p className="text-xs text-[#555] mt-1">
                    Connect your app to the control plane.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                      Platform
                    </span>
                    <div className="text-sm text-[#ccc] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {project.platform === "REACT_NATIVE"
                        ? "React Native"
                        : "Expo"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                      Created
                    </span>
                    <div className="text-sm text-[#ccc]">
                      {new Date(project.createdAt).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                    Configuration
                  </span>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] group hover:border-[#333] transition-colors">
                    <code className="text-xs text-[#7c8aff] flex-1 truncate font-mono">
                      npx arlo-sdk init --project-id={id}
                    </code>
                    <button className="p-1 text-[#444] hover:text-white transition-colors">
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <Link
                    href="#"
                    className="flex items-center gap-1.5 text-sm font-medium text-white hover:text-[#ccc] transition-colors group"
                  >
                    View Setup Guide
                    <ArrowRight
                      size={13}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </Link>
                  <span className="w-px h-3 bg-[#1f1f1f]" />
                  <button className="text-sm text-[#555] hover:text-[#999] transition-colors">
                    Generate Key
                  </button>
                </div>

              </div>

              <div className="px-5 py-3 bg-[#0c0c0c] border-t border-[#1a1a1a] flex items-center justify-between">
                <p className="text-[11px] text-[#444]">
                  Manage your flows and API keys below.
                </p>
                <button className="flex items-center gap-1 text-[11px] text-[#444] hover:text-[#888] transition-colors">
                  <Undo2 size={11} />
                  Recent Rolls
                </button>
              </div>
            </section>

            {flowCount > 0 && (
              <section className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      All Flows
                    </h3>
                    <CreateFlowButton projectId={project.id} />
                  </div>

                  <div className="grid gap-3">
                    {project.flows.map((flow) => (
                      <Link
                        key={flow.id}
                        href={`/flow/${flow.id}`}
                        className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-white/[0.15] hover:bg-white/[0.04] transition-all group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#1f1f1f] flex items-center justify-center">
                          <Layers
                            size={15}
                            className="text-orange-400/80"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">
                              {flow.name}
                            </span>
                            <code className="text-[10px] font-mono text-[#444]">
                              {flow.slug}
                            </code>
                          </div>
                          <span className="text-[11px] text-[#444]">
                            {flow._count?.versions ?? 0} version
                            {flow._count?.versions !== 1 ? "s" : ""} · Updated{" "}
                            {new Date(flow.updatedAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                            flow.status === "PUBLISHED"
                              ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                              : flow.status === "ARCHIVED"
                              ? "bg-[#0a0a0a] border-[#1f1f1f] text-[#444]"
                              : "bg-[#0a0a0a] border-[#1f1f1f] text-[#666]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              flow.status === "PUBLISHED"
                                ? "bg-emerald-400"
                                : "bg-[#444]"
                            }`}
                          />
                          {flow.status.charAt(0) +
                            flow.status.slice(1).toLowerCase()}
                        </span>

                        <ArrowRight
                          size={14}
                          className="text-[#333] group-hover:text-white transition-colors"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ── Right Column ── */}
          <div className="flex flex-col gap-6">

            {/* Flows Card */}
            <FlowsCard
              projectId={project.id}
              flowCount={flowCount}
              publishedCount={publishedFlows.length}
            />

            {/* API Keys Card */}
            <ApiKeysCard
              projectId={project.id}
              apiKeys={project.apiKeys.map((k) => ({
                id: k.id,
                name: k.name,
                prefix: k.prefix,
                environment: k.environment,
                lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
                createdAt: k.createdAt.toISOString(),
              }))}
            />

            <PlacementsCard
              projectId={project.id}
              placements={placements.map((placement) => ({
                id: placement.id,
                key: placement.key,
                name: placement.name,
                flow: {
                  id: placement.flow.id,
                  name: placement.flow.name,
                  slug: placement.flow.slug,
                  status: placement.flow.status,
                },
                createdAt: placement.createdAt.toISOString(),
              }))}
              flows={project.flows.map((flow) => ({
                id: flow.id,
                name: flow.name,
                slug: flow.slug,
                status: flow.status,
              }))}
            />

            <RegistryKeysCard
              projectId={project.id}
              registryKeys={registryKeys.map((entry) => ({
                id: entry.id,
                key: entry.key,
                type: entry.type,
                description: entry.description,
                createdAt: entry.createdAt.toISOString(),
              }))}
            />

            {/* Insights Card */}
            <section className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.15] transition-all duration-200 group hover:bg-white/[0.04] cursor-pointer">
              <span className="absolute top-3 right-3 text-[9px] font-semibold bg-[#1a1a1a] text-[#555] border border-[#1f1f1f] px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                Future
              </span>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Insights</h3>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#1f1f1f] flex items-center justify-center">
                  <BarChart3 size={16} className="text-purple-400/80" />
                </div>
              </div>
              <p className="text-xs text-[#555] leading-relaxed mb-4">
                Flow performance analytics, completion rates, and drop-off
                tracking is coming soon.
              </p>
              <div className="w-full h-10 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg flex items-center justify-center text-[10px] text-[#333] italic">
                Connecting telemetry stream...
              </div>
            </section>
          </div>
        </div>

      </div>
    </div>
  );
}
