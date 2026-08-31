"use client";

import * as React from "react";
import {
  InsightCardId,
  INSIGHT_CARD_CATALOG,
  ROLE_PRESETS,
  getDefaultCardsForRole,
} from "@/lib/insights";
import {
  Clock,
  ShieldCheck,
  FileSearch,
  CheckSquare,
  Activity,
  Package,
  MessageSquare,
  History,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw,
  Sparkles,
  GripVertical,
  X,
  CircleCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CustomizeInsightsClientProps {
  userId: string;
  orgSlug: string;
  orgRole?: string | null;
}

const ICON_MAP: Record<InsightCardId, React.ComponentType<{ className?: string }>> = {
  VIGILANCE_SLA: Clock,
  MY_APPROVALS: ShieldCheck,
  MY_INVESTIGATIONS: FileSearch,
  MY_TASKS: CheckSquare,
  CAPA_PIPELINE: Activity,
  SAMPLE_STATUS: Package,
  CUSTOMER_COMMUNICATION: MessageSquare,
  AUDIT_ACTIVITY: History,
};

export function CustomizeInsightsClient({
  userId,
  orgSlug,
  orgRole,
}: CustomizeInsightsClientProps) {
  const [selectedCards, setSelectedCards] = React.useState<InsightCardId[]>(() =>
    getDefaultCardsForRole(orgRole)
  );
  const [isSaved, setIsSaved] = React.useState(false);
  const storageKey = `arlo-insights-prefs-${userId}`;

  // Load initial preferences from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedCards(parsed);
          return;
        }
      } catch {}
    }
    setSelectedCards(getDefaultCardsForRole(orgRole));
  }, [storageKey, orgRole]);

  const handleToggleCard = (cardId: InsightCardId) => {
    setIsSaved(false);
    setSelectedCards((prev) => {
      if (prev.includes(cardId)) {
        if (prev.length <= 1) return prev; // At least 1 card required
        return prev.filter((id) => id !== cardId);
      } else {
        if (prev.length >= 4) return prev; // Max 4 cards
        return [...prev, cardId];
      }
    });
  };

  const handleMoveCard = (index: number, direction: "up" | "down") => {
    setIsSaved(false);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedCards.length) return;

    const newCards = [...selectedCards];
    const temp = newCards[index];
    newCards[index] = newCards[targetIndex];
    newCards[targetIndex] = temp;
    setSelectedCards(newCards);
  };

  const handleApplyPreset = (presetRole: string) => {
    setIsSaved(false);
    if (ROLE_PRESETS[presetRole]) {
      setSelectedCards(ROLE_PRESETS[presetRole].defaultCards);
    }
  };

  const handleResetToDefault = () => {
    setIsSaved(false);
    setSelectedCards(getDefaultCardsForRole(orgRole));
  };

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(selectedCards));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const currentRolePreset = orgRole ? ROLE_PRESETS[orgRole] : null;

  return (
    <div className="w-full space-y-6">
      {/* ── Role Context & Actions ── */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Active Role Context</CardTitle>
              <Badge variant="secondary" className="font-mono text-[11px]">
                {currentRolePreset?.label || orgRole || "Quality Member"}
              </Badge>
            </div>
            <CardDescription>
              {currentRolePreset?.description ||
                "Choose which operational widgets appear on your organization overview dashboard."}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Defaults
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
            >
              {isSaved ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Saved!
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Save Insights
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* ── Role Preset Quick-Select ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Role Preset Quick-Select</CardTitle>
            <span className="text-xs text-muted-foreground">
              Click any role to load its recommended layout
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ROLE_PRESETS).map(([key, preset]) => {
              const isCurrentUsersRole = orgRole === key;
              return (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all hover:shadow-sm py-0 gap-0 ${
                    isCurrentUsersRole
                      ? "border-primary/50 bg-accent/40 ring-1 ring-primary/20"
                      : "hover:border-muted-foreground/30"
                  }`}
                  onClick={() => handleApplyPreset(key)}
                >
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs">{preset.label}</CardTitle>
                      {isCurrentUsersRole && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <User className="h-2.5 w-2.5" />
                          Your Role
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-[11px] line-clamp-2 leading-relaxed">
                      {preset.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0 pb-3 flex-wrap gap-1">
                    {preset.defaultCards.map((cardId) => (
                      <Badge
                        key={cardId}
                        variant="secondary"
                        className="text-[9px] font-mono px-1.5 py-0"
                      >
                        {INSIGHT_CARD_CATALOG[cardId].badge}
                      </Badge>
                    ))}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Active Dashboard Cards & Display Order ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">
                Active Dashboard Cards & Display Order
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-[11px]">
                {selectedCards.length} of 4 selected
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              Top card appears first on the dashboard
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {selectedCards.map((cardId, index) => {
            const card = INSIGHT_CARD_CATALOG[cardId];
            const Icon = ICON_MAP[cardId];

            return (
              <div
                key={cardId}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3 gap-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-foreground font-mono text-xs font-bold shrink-0">
                    {index + 1}
                  </div>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {card.title}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                        {card.badge}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={index === 0}
                    onClick={() => handleMoveCard(index, "up")}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={index === selectedCards.length - 1}
                    onClick={() => handleMoveCard(index, "down")}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="xs"
                    disabled={selectedCards.length <= 1}
                    onClick={() => handleToggleCard(cardId)}
                    aria-label="Remove card"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Available Insight Cards Catalog ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Available Insight Cards Catalog</CardTitle>
          <CardDescription>
            Select the cards you want to display on your workspace overview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(INSIGHT_CARD_CATALOG) as InsightCardId[]).map((cardId) => {
              const card = INSIGHT_CARD_CATALOG[cardId];
              const isSelected = selectedCards.includes(cardId);
              const Icon = ICON_MAP[cardId];
              const isRecommendedForUser = orgRole && card.recommendedRoles.includes(orgRole);

              return (
                <Card
                  key={cardId}
                  onClick={() => handleToggleCard(cardId)}
                  className={`cursor-pointer transition-all py-0 gap-0 ${
                    isSelected
                      ? "border-primary ring-1 ring-primary/30 shadow-sm"
                      : "hover:border-muted-foreground/30 hover:shadow-sm"
                  }`}
                >
                  <CardHeader className="pt-4 pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-xs">{card.title}</CardTitle>
                            <Badge variant="secondary" className="text-[10px] font-mono">
                              {card.badge}
                            </Badge>
                            {isRecommendedForUser && (
                              <Badge
                                className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                                variant="outline"
                              >
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-[11px] font-mono">
                            {card.subtitle}
                          </CardDescription>
                        </div>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-input bg-background"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-0">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                  </CardContent>

                  <CardFooter className="pt-3 pb-3">
                    <Separator className="absolute left-0 right-0 top-0" />
                    <div className="flex items-center justify-between w-full pt-2 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {card.category}
                      </Badge>
                      <span className="font-mono">
                        {isSelected ? (
                          <span className="flex items-center gap-1 text-primary">
                            <CircleCheck className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          "Click to Add"
                        )}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
