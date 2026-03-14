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
  BarChart3
} from "lucide-react";

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

  const flowCount = project.flows.length;
  const keyCount = project.apiKeys.length;
  const publishedFlows = project.flows.filter(f => f.status === 'PUBLISHED');

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {project.iconUrl ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.04]">
              <Image 
                src={project.iconUrl} 
                alt={project.name} 
                width={48} 
                height={48} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <span className="text-black font-bold text-xl">
                {project.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
              <span className="text-[10px] font-semibold bg-white/[0.06] text-white/40 border border-white/[0.1] px-1.5 py-0.5 rounded uppercase tracking-wider">
                {project.platform.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-white/40">Project ID: <code className="text-[11px] font-mono text-white/60 bg-white/[0.06] border border-white/[0.1] px-1.5 py-0.5 rounded-md">{project.id}</code></p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="#" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <ExternalLink size={14} />
            SDK Docs
          </Link>
          <Link 
            href="#" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <Settings size={14} />
            Settings
          </Link>
        </div>
      </header>

      {/* Main Stats/Deployment Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Quick Start Card (Main Focus) */}
        <section className="border border-white/[0.08] bg-white/[0.03] rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start">
            {/* Visual/Preview Side */}
            <div className="w-full md:w-[45%] aspect-video bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/[0.05] rounded-xl flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#0a0a0a]/40 group-hover:bg-[#0a0a0a]/20 transition-colors" />
              <div className="z-10 text-center space-y-3 p-6">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
                  <Rocket size={24} className="text-white/80" />
                </div>
                <h3 className="font-semibold text-white">SDK Ready for Integration</h3>
                <p className="text-xs text-white/50 max-w-[240px] mx-auto line-clamp-2">
                  Initialize the Arlo SDK in your {project.platform === 'REACT_NATIVE' ? 'React Native' : 'Expo'} app to start delivering dynamic flows.
                </p>
              </div>
            </div>

            {/* Content Side */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Project Infrastructure</h2>
                  <p className="text-sm text-white/40">Connect your app to the control plane.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Platform</span>
                    <div className="text-sm text-white/80 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      {project.platform === 'REACT_NATIVE' ? 'React Native' : 'Expo'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Created</span>
                    <div className="text-sm text-white/80">
                      {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Configuration</span>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] group hover:border-white/20 transition-colors">
                    <code className="text-xs text-indigo-400 flex-1 truncate">npx arlo-sdk init --project-id={id}</code>
                    <button className="p-1.5 text-white/30 hover:text-white transition-colors">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 flex items-center gap-3">
                <Link href="#" className="flex items-center gap-2 text-sm font-medium text-white hover:text-white/80 transition-colors group">
                  View Setup Guide
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <button className="text-sm font-medium text-white/40 hover:text-white/70 transition-colors">
                  Generate Key
                </button>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-3 bg-white/[0.02] border-t border-white/[0.05] flex items-center justify-between">
            <p className="text-[11px] text-white/30 font-medium">To update your infrastructure, manage your flows and API keys below.</p>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/60">
                <Undo2 size={12} />
                Recent Rolls
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Three Cards (Stats/Quick Links) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Flows Card */}
          <section className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.15] transition-all duration-200 group hover:bg-white/[0.04] cursor-pointer">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Layers size={18} className="text-orange-400" />
              </div>
              <Link href="#" className="p-1.5 rounded-lg bg-white/[0.05] text-white/40 hover:text-white transition-colors">
                <ArrowRight size={16} />
              </Link>
            </div>
            <h3 className="font-semibold text-white mb-1">Flows</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-2xl font-bold text-white leading-none">{flowCount}</span>
              <span className="text-xs text-white/40 mb-1 leading-none">total flows</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                {publishedFlows.length} Published
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold">
                {flowCount - publishedFlows.length} Drafts
              </div>
            </div>
          </section>

          {/* API Keys Card */}
          <section className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.15] transition-all duration-200 group hover:bg-white/[0.04] cursor-pointer">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Key size={18} className="text-blue-400" />
              </div>
              <Link href="#" className="p-1.5 rounded-lg bg-white/[0.05] text-white/40 hover:text-white transition-colors">
                <ArrowRight size={16} />
              </Link>
            </div>
            <h3 className="font-semibold text-white mb-1">API Access</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-2xl font-bold text-white leading-none">{keyCount}</span>
              <span className="text-xs text-white/40 mb-1 leading-none">active keys</span>
            </div>
            <div className="text-xs text-white/40 flex items-center gap-1.5">
              <History size={12} />
              Latest used: {project.apiKeys[0]?.lastUsedAt ? new Date(project.apiKeys[0].lastUsedAt).toLocaleDateString() : 'Never'}
            </div>
          </section>

          {/* Analytics Placeholder Card */}
          <section className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.15] transition-all duration-200 group hover:bg-white/[0.04] cursor-pointer">
            <div className="absolute top-3 right-3">
              <span className="text-[9px] font-bold bg-white/10 text-white/40 border border-white/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
                Future
              </span>
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-6">
                <BarChart3 size={18} className="text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">Insights</h3>
              <p className="text-xs text-white/30 leading-relaxed mb-4">
                Flow performance analytics, completion rates, and drop-off tracking is coming soon.
              </p>
            </div>
            <div className="w-full h-12 bg-white/[0.03] border border-white/[0.05] rounded-lg flex items-center justify-center gap-2 text-[10px] font-medium text-white/20 italic">
              Connecting telemetry stream...
            </div>
          </section>
        </div>
      </div>

      {/* Primary Action Section */}
      {flowCount === 0 && (
        <section className="mt-4 p-8 border border-dashed border-white/[0.15] bg-white/[0.03] rounded-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-2">
            <Plus size={24} className="text-white/40" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white px-8">Ready to create your first flow?</h2>
            <p className="text-sm text-white/40 max-w-sm mx-auto">
              Flows are the building blocks of your onboarding. Start by defining your first screen sequence.
            </p>
          </div>
          <button className="bg-white text-black px-8 py-3 rounded-full text-sm font-bold hover:bg-white/90 transition-all flex items-center gap-2 mx-auto cursor-pointer">
            <Plus size={16} />
            Create Your First Flow
          </button>
        </section>
      )}
    </div>
  );
}


