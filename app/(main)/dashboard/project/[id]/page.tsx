import React from "react";
import { getProject } from "../actions";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  Settings,
  Undo2,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { CreateFlowButton } from "@/app/(main)/dashboard/project/[id]/_components/create-flow-dialog";
import { FlowsCard } from "@/app/(main)/dashboard/project/[id]/_components/flows-card";
import { ApiKeysCard } from "@/app/(main)/dashboard/key/_components/api-keys-card";
import { EntryPointsCard } from "@/app/(main)/dashboard/project/[id]/_components/entry-points-card";
import { RegistryKeysCard } from "@/app/(main)/dashboard/project/[id]/_components/registry-keys-card";
import { FlowListItem } from "@/app/(main)/dashboard/project/[id]/_components/flow-list-item";

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
    if (error instanceof Error && error.message === "Project not found") {
      notFound();
    }

    throw error;
  }

  const entryPoints = project.entryPoints ?? [];
  const registryKeys = project.registryKeys ?? [];
  const flowCount = project.flows.length;
  const publishedFlows = project.flows.filter(
    (f) => f.developmentVersion || f.productionVersion
  );
  const flowVersionMap = new Map(
    project.flows.map((flow) => [
      flow.id,
      {
        developmentVersion: flow.developmentVersion,
        productionVersion: flow.productionVersion,
      },
    ])
  );
  const flowOptions = project.flows.map((flow) => ({
    id: flow.id,
    name: flow.name,
    slug: flow.slug,
    status: flow.status,
    developmentVersion: flow.developmentVersion
      ? {
          id: flow.developmentVersion.id,
          version: flow.developmentVersion.version,
        }
      : null,
    productionVersion: flow.productionVersion
      ? {
          id: flow.productionVersion.id,
          version: flow.productionVersion.version,
        }
      : null,
  }));
  const entryPointCards = entryPoints.map((entryPoint) => {
    const flowVersions = flowVersionMap.get(entryPoint.flow.id);

    return {
      id: entryPoint.id,
      key: entryPoint.key,
      name: entryPoint.name,
      environment: entryPoint.environment,
      flow: {
        id: entryPoint.flow.id,
        name: entryPoint.flow.name,
        slug: entryPoint.flow.slug,
        status: entryPoint.flow.status,
        developmentVersion: flowVersions?.developmentVersion
          ? {
              id: flowVersions.developmentVersion.id,
              version: flowVersions.developmentVersion.version,
            }
          : null,
        productionVersion: flowVersions?.productionVersion
          ? {
              id: flowVersions.productionVersion.id,
              version: flowVersions.productionVersion.version,
            }
          : null,
      },
      variants: (entryPoint.variants ?? []).map((v) => {
        const versionData = flowVersionMap.get(v.flow.id);
        return {
          id: v.id,
          flowId: v.flowId ?? v.flow.id,
          percentage: v.percentage,
          order: v.order,
          flow: {
            id: v.flow.id,
            name: v.flow.name,
            slug: v.flow.slug,
            status: v.flow.status,
            developmentVersion: versionData?.developmentVersion
              ? {
                  id: versionData.developmentVersion.id,
                  version: versionData.developmentVersion.version,
                }
              : null,
            productionVersion: versionData?.productionVersion
              ? {
                  id: versionData.productionVersion.id,
                  version: versionData.productionVersion.version,
                }
              : null,
          },
        };
      }),
      createdAt: entryPoint.createdAt.toISOString(),
    };
  });

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
                    <CopyButton value={`npx arlo-sdk init --project-id=${id}`} />


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
                      <FlowListItem
                        key={flow.id}
                        projectId={project.id}
                        flow={{
                          id: flow.id,
                          name: flow.name,
                          slug: flow.slug,
                          status: flow.status,
                          developmentVersion: flow.developmentVersion
                            ? {
                                id: flow.developmentVersion.id,
                                version: flow.developmentVersion.version,
                              }
                            : null,
                          productionVersion: flow.productionVersion
                            ? {
                                id: flow.productionVersion.id,
                                version: flow.productionVersion.version,
                              }
                            : null,
                          updatedAt: flow.updatedAt.toISOString(),
                          versionCount: flow._count?.versions ?? 0,
                        }}
                      />
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

            <EntryPointsCard
              projectId={project.id}
              entryPoints={entryPointCards}
              flows={flowOptions}
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

            {/* Analytics Card */}
            <Link
              href={`/dashboard/project/${project.id}/analytics`}
              className="block rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Analytics</h3>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  Live
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#1f1f1f] flex items-center justify-center">
                  <BarChart3 size={16} className="text-emerald-300" />
                </div>
              </div>
              <p className="text-xs text-[#555] leading-relaxed mb-4">
                Open project analytics to see Tinybird-powered usage, top pages,
                sessions, and geo breakdowns for this project.
              </p>
              <div className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2.5 text-[11px] text-[#666]">
                Click to open analytics for {project.name}.
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
