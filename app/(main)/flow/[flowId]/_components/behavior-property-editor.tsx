"use client";

import React from "react";
import {
  ArrowRight,
  Columns2,
  ExternalLink,
  GalleryHorizontal,
  ListChecks,
  MousePointer2,
  Plus,
  SlidersHorizontal,
  Sparkles,
  SquareMousePointer,
  TextCursorInput,
  Trash2,
  Zap,
  CheckCircle2,
} from "lucide-react";

import type {
  ComponentAction,
  ComponentInteraction,
  ComponentType,
  FlowComponent,
  NavigateActionConfig,
  Screen,
  SetVariableActionConfig,
  TriggerType,
} from "@/lib/types";

interface BehaviorPropertyEditorProps {
  component: FlowComponent;
  screens?: Screen[];
  onUpdateInteractions: (interactions: ComponentInteraction[]) => void;
  onConvertComponent?: (nextType: ComponentType) => void;
}

// Behavioral Definition Mapping
const BEHAVIOR_TYPES = [
  {
    type: "BUTTON",
    label: "Button",
    description: "Tap to navigate between screens.",
    icon: SquareMousePointer,
    trigger: "ON_PRESS" as TriggerType,
    actionType: "NAVIGATE" as ComponentAction["type"],
    createDefaultConfig: (): NavigateActionConfig => ({ targetType: "NEXT", animation: "SLIDE", durationMs: 300 }),
  },
  {
    type: "SINGLE_SELECT",
    label: "Multiple Choice (Single)",
    description: "Pick one distinct option.",
    icon: ListChecks,
    trigger: "ON_VALUE_CHANGE" as TriggerType,
    actionType: "SET_VARIABLE" as ComponentAction["type"],
    createDefaultConfig: (c: FlowComponent): SetVariableActionConfig => ({ variableKey: `${c.id}_choice`, valueSource: "EVENT_VALUE" }),
  },
  {
    type: "MULTI_SELECT",
    label: "Multiple Choice (Multi)",
    description: "Pick many distinct options.",
    icon: ListChecks,
    trigger: "ON_VALUE_CHANGE" as TriggerType,
    actionType: "SET_VARIABLE" as ComponentAction["type"],
    createDefaultConfig: (c: FlowComponent): SetVariableActionConfig => ({ variableKey: `${c.id}_choices`, valueSource: "EVENT_VALUE" }),
  },
  {
    type: "TEXT_INPUT",
    label: "Text Input",
    description: "Capture typed answers.",
    icon: TextCursorInput,
    trigger: "ON_VALUE_CHANGE" as TriggerType,
    actionType: "SET_VARIABLE" as ComponentAction["type"],
    createDefaultConfig: (c: FlowComponent): SetVariableActionConfig => ({ variableKey: `${c.id}_text`, valueSource: "EVENT_VALUE" }),
  },
];

const ADVANCED_BEHAVIORS = [
  {
    label: "Custom Action",
    description: "Add a raw event, API call, or haptic.",
    icon: Zap,
    onAdd: (component: FlowComponent, update: any) => {
      const interactions = component.interactions || [];
      update([...interactions, {
        id: Math.random().toString(36).substring(2, 9),
        trigger: "ON_PRESS",
        actions: [{ id: Math.random().toString(36).substring(2, 9), type: "CUSTOM_EVENT", config: { name: "custom_event" } }]
      }]);
    }
  }
];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function BehaviorPropertyEditor({
  component,
  screens = [],
  onUpdateInteractions,
  onConvertComponent,
}: BehaviorPropertyEditorProps) {
  const interactions = component.interactions || [];

  const handleAddBehavior = (behaviorDef: typeof BEHAVIOR_TYPES[0]) => {
    if (onConvertComponent) {
      onConvertComponent(behaviorDef.type as ComponentType);
    }
    
    // Add default behavior interaction
    const newInteraction: ComponentInteraction = {
      id: generateId(),
      trigger: behaviorDef.trigger,
      actions: [
        {
          id: generateId(),
          type: behaviorDef.actionType,
          config: behaviorDef.createDefaultConfig(component),
        },
      ],
    };
    onUpdateInteractions([newInteraction]);
  };

  const handleClearBehaviors = () => {
    // Optionally convert back to a generic FRAME if possible, but for now just clearing interactions acts as removing the behavior logic.
    onUpdateInteractions([]);
  };

  const updateActionConfig = (interactionId: string, actionId: string, patch: Record<string, unknown>) => {
    onUpdateInteractions(
      interactions.map((interaction) => {
        if (interaction.id !== interactionId) return interaction;
        return {
          ...interaction,
          actions: interaction.actions.map((action) => {
            if (action.id !== actionId) return action;
            return { ...action, config: { ...action.config, ...patch } };
          }),
        };
      }),
    );
  };
  
  const updateInteractionTrigger = (id: string, trigger: ComponentInteraction["trigger"]) => {
    onUpdateInteractions(
      interactions.map((interaction) =>
        interaction.id === id ? { ...interaction, trigger } : interaction,
      ),
    );
  };
  
  const updateActionType = (
    interactionId: string,
    actionId: string,
    type: ComponentAction["type"],
  ) => {
    onUpdateInteractions(
      interactions.map((interaction) => {
        if (interaction.id !== interactionId) return interaction;
        return {
          ...interaction,
          actions: interaction.actions.map((action) => {
            if (action.id !== actionId) return action;

            let nextConfig: Record<string, unknown> = {};
            if (type === "NAVIGATE") nextConfig = { targetType: "NEXT", animation: "SLIDE", durationMs: 300 };
            else if (type === "SET_VARIABLE") nextConfig = { variableKey: `${component.id}_var`, valueSource: "EVENT_VALUE" };
            else if (type === "OPEN_URL") nextConfig = { url: "https://" };
            else if (type === "TRIGGER_HAPTIC") nextConfig = { style: "LIGHT" };
            else if (type === "CUSTOM_EVENT") nextConfig = { name: "custom_event" };

            return { ...action, type, config: nextConfig };
          }),
        };
      }),
    );
  };

  const addActionToInteraction = (interactionId: string) => {
    onUpdateInteractions(
      interactions.map((interaction) => {
        if (interaction.id !== interactionId) return interaction;
        return {
          ...interaction,
          actions: [
            ...interaction.actions,
            { id: generateId(), type: "NAVIGATE", config: { targetType: "NEXT", animation: "SLIDE", durationMs: 300 } },
          ],
        };
      }),
    );
  };

  const deleteActionFromInteraction = (interactionId: string, actionId: string) => {
    onUpdateInteractions(
      interactions.map((interaction) => {
        if (interaction.id !== interactionId) return interaction;
        return {
          ...interaction,
          actions: interaction.actions.filter((action) => action.id !== actionId),
        };
      }),
    );
  };

  const deleteInteraction = (id: string) => {
    onUpdateInteractions(interactions.filter((i) => i.id !== id));
  };


  // Determine if we should show the "Add Behavior" state or the "Active Behavior" card.
  // In Muta-style, the Behavior Card visually encompasses the component's identity and its primary action.
  const activeBehaviorDef = BEHAVIOR_TYPES.find((b) => b.type === component.type);
  const hasBehaviors = activeBehaviorDef || interactions.length > 0;

  if (!hasBehaviors) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-[12px] font-semibold text-white">Behaviors</h3>
          <p className="mt-1 text-[10px] text-white/40">Give this layer a superpower.</p>
        </div>

        <div className="space-y-2">
          {BEHAVIOR_TYPES.map((b) => {
            const Icon = b.icon;
            return (
              <button
                key={b.type}
                onClick={() => handleAddBehavior(b)}
                className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition-all hover:bg-white/[0.06]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/20">
                  <Icon size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-white">{b.label}</p>
                  <p className="mt-0.5 text-[10px] text-white/40">{b.description}</p>
                </div>
                <div className="ml-auto text-white/20">
                  <Plus size={14} />
                </div>
              </button>
            );
          })}
          
          <div className="pt-2 border-t border-white/[0.04]">
            {ADVANCED_BEHAVIORS.map((b, i) => {
              const Icon = b.icon;
              return (
                <button
                  key={i}
                  onClick={() => b.onAdd(component, onUpdateInteractions)}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-all hover:bg-white/[0.04]"
                >
                   <Icon size={14} className="text-white/40" />
                   <div>
                     <p className="text-[11px] font-medium text-white/70">{b.label}</p>
                   </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE BEHAVIOR VIEW
  const Icon = activeBehaviorDef?.icon || Zap;
  const label = activeBehaviorDef?.label || "Custom Behavior";

  return (
    <div className="space-y-4">
      {/* Behavior Identity Card */}
      <div className="rounded-xl border border-white/[0.1] bg-[#121214] shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Icon size={14} className={activeBehaviorDef ? "text-blue-400" : "text-white/60"} />
            <div>
              <span className="text-[11px] font-bold text-white">{label}</span>
              {activeBehaviorDef && (
                <span className="ml-2 text-[9px] font-medium text-white/40">{activeBehaviorDef.description}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleClearBehaviors}
            className="text-white/30 hover:text-red-400 p-1 rounded-md hover:bg-white/[0.06] transition-colors"
            title="Remove behavior"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Content (Inline actions) */}
        <div className="p-3 space-y-4">
          {interactions.map((interaction, iIndex) => (
             <div key={interaction.id} className={iIndex > 0 ? "pt-3 border-t border-white/[0.06]" : ""}>
                <div className="mb-2 flex items-center gap-2">
                   <MousePointer2 size={12} className="text-white/40" />
                   <select
                     value={interaction.trigger}
                     onChange={(e) => updateInteractionTrigger(interaction.id, e.target.value as ComponentInteraction["trigger"])}
                     className="bg-transparent text-[10px] font-medium text-white outline-none"
                   >
                     <option value="ON_PRESS">Tap</option>
                     <option value="ON_VALUE_CHANGE">Value Changed</option>
                     <option value="ON_MOUNT">Mount</option>
                     <option value="ON_LONG_PRESS">Hold</option>
                   </select>
                   
                   {interactions.length > 1 && (
                     <button onClick={() => deleteInteraction(interaction.id)} className="ml-auto text-white/20 hover:text-red-400">
                       <Trash2 size={10} />
                     </button>
                   )}
                </div>

                <div className="space-y-2 pl-5">
                   {interaction.actions.map((action, aIndex) => {
                     const isNav = action.type === "NAVIGATE";
                     const isVar = action.type === "SET_VARIABLE";
                     
                     return (
                       <div key={action.id} className="relative rounded-lg border border-white/[0.04] bg-black/20 p-2">
                           <div className="flex items-center justify-between mb-2">
                             <select
                               value={action.type}
                               onChange={(e) => updateActionType(interaction.id, action.id, e.target.value as ComponentAction["type"])}
                               className="bg-transparent text-[11px] font-semibold text-emerald-400 outline-none"
                             >
                               <option value="NAVIGATE">Navigate</option>
                               <option value="SET_VARIABLE">Set Variable</option>
                               <option value="OPEN_URL">Open URL</option>
                               <option value="TRIGGER_HAPTIC">Haptics</option>
                               <option value="CUSTOM_EVENT">Custom Event</option>
                             </select>
                             <button onClick={() => deleteActionFromInteraction(interaction.id, action.id)} className="text-white/20 hover:text-red-400">
                               <Trash2 size={11} />
                             </button>
                           </div>

                           {isNav && (
                             <div className="space-y-1.5">
                               <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-white/50">To</span>
                                  <select
                                    value={(action.config as NavigateActionConfig).targetType}
                                    onChange={(e) => updateActionConfig(interaction.id, action.id, { targetType: e.target.value })}
                                    className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white"
                                  >
                                    <option value="NEXT">Next Screen</option>
                                    <option value="PREVIOUS">Previous Screen</option>
                                    <option value="SPECIFIC_SCREEN">Specific Screen</option>
                                    <option value="DISMISS">End Flow</option>
                                  </select>
                               </div>
                               {(action.config as NavigateActionConfig).targetType === "SPECIFIC_SCREEN" && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-white/50">Screen</span>
                                    <select
                                      value={(action.config as NavigateActionConfig).targetScreenId || ""}
                                      onChange={(e) => updateActionConfig(interaction.id, action.id, { targetScreenId: e.target.value })}
                                      className="w-[120px] rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white"
                                    >
                                      <option value="">Select screen...</option>
                                      {screens.map((s) => <option key={s.id} value={s.id}>{s.name || "Unnamed"}</option>)}
                                    </select>
                                  </div>
                               )}
                               <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-white/50">Animation</span>
                                  <div className="flex gap-1">
                                    <select
                                      value={(action.config as NavigateActionConfig).animation}
                                      onChange={(e) => updateActionConfig(interaction.id, action.id, { animation: e.target.value })}
                                      className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white"
                                    >
                                      <option value="SLIDE">Slide</option>
                                      <option value="FADE">Fade</option>
                                      <option value="NONE">None</option>
                                    </select>
                                    <input
                                      type="number"
                                      value={(action.config as NavigateActionConfig).durationMs || 300}
                                      onChange={(e) => updateActionConfig(interaction.id, action.id, { durationMs: parseInt(e.target.value, 10) || 0 })}
                                      className="w-[45px] rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-right text-[10px] text-white"
                                    />
                                  </div>
                               </div>
                             </div>
                           )}

                           {isVar && (
                             <div className="space-y-1.5">
                               <div className="flex items-center justify-between">
                                 <span className="text-[10px] text-white/50">Variable</span>
                                 <input
                                   type="text"
                                   value={((action.config as SetVariableActionConfig).variableKey as string) || ""}
                                   onChange={(e) => updateActionConfig(interaction.id, action.id, { variableKey: e.target.value })}
                                   className="w-[120px] rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white"
                                 />
                               </div>
                             </div>
                           )}

                           {action.type === "OPEN_URL" && (
                             <div className="flex items-center justify-between">
                               <span className="text-[10px] text-white/50">URL</span>
                               <input
                                 type="text"
                                 value={((action.config as Record<string, unknown>).url as string) || ""}
                                 onChange={(e) => updateActionConfig(interaction.id, action.id, { url: e.target.value })}
                                 className="w-[120px] rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white"
                               />
                             </div>
                           )}
                           
                           {/* Add more inline action configs if needed */}
                       </div>
                     );
                   })}
                   
                   <button
                     onClick={() => addActionToInteraction(interaction.id)}
                     className="mt-1 flex items-center gap-1 text-[9px] font-medium text-white/30 hover:text-white"
                   >
                     <Plus size={10} /> Add Action
                   </button>
                </div>
             </div>
          ))}

          {interactions.length === 0 && (
             <div className="rounded-lg border border-dashed border-white/[0.1] p-4 text-center">
               <span className="text-[10px] text-white/40">No interactions enabled for this behavior.</span>
               <button onClick={() => {
                 onUpdateInteractions([{ id: generateId(), trigger: "ON_PRESS", actions: [] }]);
               }} className="block mx-auto mt-2 text-[10px] text-emerald-400 font-semibold hover:text-emerald-300">
                 + Add Interaction
               </button>
             </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end pr-1">
        <button 
          onClick={() => {
            onUpdateInteractions([...interactions, { id: generateId(), trigger: "ON_PRESS", actions: [] }]);
          }}
          className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white transition-colors"
        >
          <Plus size={10} /> Add extra trigger
        </button>
      </div>
    </div>
  );
}
