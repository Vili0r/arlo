"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  Rocket,
  ScrollText,
  BarChart3,
  Gauge,
  Eye,
  Shield,
  Globe,
  Link2,
  Puzzle,
  HardDrive,
  Flag,
  Bot,
  Cpu,
  Box,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Zap,
  X,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  active?: boolean;
  hasSubmenu?: boolean;
}

const navItems: NavItem[] = [
  { label: "Projects", icon: <LayoutGrid size={18} />, href: "/dashboard", active: true },
  { label: "Deployments", icon: <Rocket size={18} />, href: "#" },
  { label: "Logs", icon: <ScrollText size={18} />, href: "#" },
  { label: "Analytics", icon: <BarChart3 size={18} />, href: "#" },
  { label: "Speed Insights", icon: <Gauge size={18} />, href: "#" },
  { label: "Observability", icon: <Eye size={18} />, href: "#", hasSubmenu: true },
  { label: "Firewall", icon: <Shield size={18} />, href: "#" },
  { label: "CDN", icon: <Globe size={18} />, href: "#" },
  { label: "Domains", icon: <Link2 size={18} />, href: "#" },
  { label: "Integrations", icon: <Puzzle size={18} />, href: "#" },
  { label: "Storage", icon: <HardDrive size={18} />, href: "#" },
  { label: "Flags", icon: <Flag size={18} />, href: "#" },
  { label: "Agent", icon: <Bot size={18} />, href: "#", hasSubmenu: true },
  { label: "AI Gateway", icon: <Cpu size={18} />, href: "#", hasSubmenu: true },
  { label: "Sandboxes", icon: <Box size={18} />, href: "#" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const {user} = useUser();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[240px] bg-[#0a0a0a] border-r border-white/[0.08]
          flex flex-col transition-transform duration-300 ease-in-out flex-shrink-0
          lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.08]">
          <button className="flex items-center gap-2 group overflow-hidden">
            <span className="text-sm font-semibold text-white truncate">
              {user?.firstName}&apos;s projects
            </span>
            <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">Pro</span>
            <ChevronDown size={14} className="text-white/50 flex-shrink-0" />
          </button>
          <button
            className="lg:hidden p-1 rounded hover:bg-white/10 text-white/50"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors">
            <Search size={14} className="text-white/40" />
            <span className="text-sm text-white/40 flex-1 text-left">Find...</span>
            <kbd className="text-[10px] text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">⌘F</kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-thin">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href || "#"}
              className={`
                flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-sm font-medium transition-colors
                ${
                  item.active
                    ? "bg-white/[0.1] text-white"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
                }
              `}
            >
              <span className={item.active ? "text-white" : "text-white/50"}>{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.hasSubmenu && <ChevronRight size={14} className="text-white/30" />}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.08] px-3 py-3">
          <div className="flex items-center gap-2">
            <UserButton />
            <span className="text-xs text-white/70 truncate flex-1">
              {user?.firstName}
            </span>
            <button className="p-1 rounded hover:bg-white/10">
              <MoreHorizontal size={14} className="text-white/40" />
            </button>
            <button className="p-1 rounded hover:bg-white/10">
              <Zap size={14} className="text-white/40" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
