"use client";

import * as React from "react";
import Link from "next/link";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import { InsightCardId, getDefaultCardsForRole } from "@/lib/insights";
import { InsightCardRenderer, InsightsData } from "./insight-cards";

interface InsightsContainerProps {
  data: InsightsData;
  orgRole?: string | null;
}

export function InsightsContainer({ data, orgRole }: InsightsContainerProps) {
  const [selectedCards, setSelectedCards] = React.useState<InsightCardId[]>(() =>
    getDefaultCardsForRole(orgRole)
  );
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const storageKey = `arlo-insights-prefs-${data.userId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedCards(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved insight card preferences", e);
      }
    }
    // Fallback to role defaults
    setSelectedCards(getDefaultCardsForRole(orgRole));
  }, [data.userId, orgRole]);

  // Listen for storage events if changed in another tab or updated from settings
  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `arlo-insights-prefs-${data.userId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedCards(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [data.userId]);

  return (
    <div className="space-y-6">
      {/* Render selected cards */}
      <div className="space-y-6">
        {selectedCards.map((cardId) => (
          <InsightCardRenderer key={cardId} cardId={cardId} data={data} />
        ))}
      </div>
    </div>
  );
}
