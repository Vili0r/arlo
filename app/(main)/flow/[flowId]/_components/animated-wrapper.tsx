"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  type ComponentAnimation,
  type AnimationConfig,
  buildEntranceCSS,
  DEFAULT_ANIMATION,
} from "../_lib/animation-presets";

/* ════════════════════════════════════════════════════════════
   ANIMATED COMPONENT WRAPPER
   
   Wraps each component in the phone preview and applies
   CSS keyframe animations based on the component's config.
   
   Usage in phone-preview.tsx:
   
   <AnimatedWrapper
     componentId={comp.id}
     animation={comp.props.animation}
     screenIndex={selectedScreenIndex}
   >
     <PhonePreviewComponent ... />
   </AnimatedWrapper>
   ════════════════════════════════════════════════════════════ */

export function AnimatedWrapper({
  componentId,
  animation,
  screenIndex,
  children,
}: {
  componentId: string;
  animation?: ComponentAnimation;
  screenIndex: number;
  children: React.ReactNode;
}) {
  // Re-trigger animations when screen changes
  const [animKey, setAnimKey] = useState(0);
  const prevScreenRef = useRef(screenIndex);

  useEffect(() => {
    if (prevScreenRef.current !== screenIndex) {
      prevScreenRef.current = screenIndex;
      setAnimKey((k) => k + 1);
    }
  }, [screenIndex]);

  const entrance = animation?.entrance;
  const hasEntrance = entrance && entrance.type !== "none";

  // Build CSS for this component's entrance animation
  const entranceResult = useMemo(() => {
    if (!hasEntrance || !entrance) return null;
    return buildEntranceCSS(componentId, entrance);
  }, [componentId, entrance, hasEntrance]);

  // No animation — render children directly
  if (!entranceResult) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Inject the @keyframes rule */}
      <style>{entranceResult.keyframeCSS}</style>
      <div
        key={`${componentId}-${animKey}`}
        style={{
          animation: entranceResult.animationStyle,
        }}
      >
        {children}
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   SCREEN TRANSITION WRAPPER
   
   Wraps the entire screen content area and applies a
   transition animation when switching between screens.
   
   Usage in page.tsx — wrap the screenContent:
   
   <ScreenTransitionWrapper
     screenIndex={selectedScreenIndex}
     transition={config.settings?.screenTransition}
   >
     {screenContent}
   </ScreenTransitionWrapper>
   ════════════════════════════════════════════════════════════ */

export function ScreenTransitionWrapper({
  screenIndex,
  transition,
  children,
}: {
  screenIndex: number;
  transition?: { type: string; duration: number; easing?: string };
  children: React.ReactNode;
}) {
  const [displayIndex, setDisplayIndex] = useState(screenIndex);
  const [animClass, setAnimClass] = useState("");
  const prevIndex = useRef(screenIndex);
  const type = transition?.type || "slide-left";
  const duration = transition?.duration || 300;

  useEffect(() => {
    if (prevIndex.current === screenIndex) return;

    const goingForward = screenIndex > prevIndex.current;
    prevIndex.current = screenIndex;

    if (type === "none") {
      setDisplayIndex(screenIndex);
      return;
    }

    // Determine animation class based on transition type and direction
    let enterClass = "";
    switch (type) {
      case "slide-left":
        enterClass = goingForward ? "screen-slide-in-left" : "screen-slide-in-right";
        break;
      case "slide-up":
        enterClass = goingForward ? "screen-slide-in-up" : "screen-slide-in-down";
        break;
      case "fade":
      case "crossfade":
        enterClass = "screen-fade-in";
        break;
      case "scale-fade":
        enterClass = "screen-scale-fade-in";
        break;
      default:
        enterClass = "screen-fade-in";
    }

    setAnimClass(enterClass);
    setDisplayIndex(screenIndex);

    // Clear class after animation completes
    const timer = setTimeout(() => setAnimClass(""), duration + 50);
    return () => clearTimeout(timer);
  }, [screenIndex, type, duration]);

  return (
    <>
      <style>{`
        @keyframes screenSlideInLeft {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes screenSlideInRight {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes screenSlideInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes screenSlideInDown {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes screenFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes screenScaleFadeIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .screen-slide-in-left { animation: screenSlideInLeft ${duration}ms ease-out both; }
        .screen-slide-in-right { animation: screenSlideInRight ${duration}ms ease-out both; }
        .screen-slide-in-up { animation: screenSlideInUp ${duration}ms ease-out both; }
        .screen-slide-in-down { animation: screenSlideInDown ${duration}ms ease-out both; }
        .screen-fade-in { animation: screenFadeIn ${duration}ms ease-out both; }
        .screen-scale-fade-in { animation: screenScaleFadeIn ${duration}ms ease-out both; }
      `}</style>
      <div key={displayIndex} className={animClass} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </>
  );
}