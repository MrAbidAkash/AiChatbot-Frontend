"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface CursorConfig {
  // Main cursor settings
  cursorSize?: number;
  cursorColor?: string;
  cursorBorderWidth?: number;
  cursorBorderColor?: string;
  
  // Trail cursor settings
  trailSize?: number;
  trailColor?: string;
  trailBorderWidth?: number;
  trailBorderColor?: string;
  
  // Animation settings
  trailDelay?: number; // Higher = more delay/lag (0.1 - 0.3 recommended)
  hoverScale?: number; // Scale multiplier when hovering interactive elements
  clickScale?: number; // Scale multiplier when clicking
  
  // Behavior
  hideOnLeave?: boolean;
  showOnTouch?: boolean;
}

const defaultConfig: Required<CursorConfig> = {
  cursorSize: 8,
  cursorColor: "oklch(0.70 0.18 180)", // primary color
  cursorBorderWidth: 0,
  cursorBorderColor: "transparent",
  trailSize: 32,
  trailColor: "transparent",
  trailBorderWidth: 2,
  trailBorderColor: "oklch(0.70 0.18 180 / 0.5)",
  trailDelay: 0.15,
  hoverScale: 1.5,
  clickScale: 0.8,
  hideOnLeave: true,
  showOnTouch: false,
};

export function AnimatedCursor(props: CursorConfig = {}) {
  const config = { ...defaultConfig, ...props };
  
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const trailPos = useRef({ x: 0, y: 0 });
  const isVisible = useRef(false);
  const isHovering = useRef(false);
  const isClicking = useRef(false);
  const rafId = useRef<number | null>(null);

  // Linear interpolation for smooth movement
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  // Animation loop
  const animate = useCallback(() => {
    // Smooth cursor follow with different speeds
    cursorPos.current.x = lerp(cursorPos.current.x, mousePos.current.x, 0.35);
    cursorPos.current.y = lerp(cursorPos.current.y, mousePos.current.y, 0.35);
    
    trailPos.current.x = lerp(trailPos.current.x, mousePos.current.x, config.trailDelay);
    trailPos.current.y = lerp(trailPos.current.y, mousePos.current.y, config.trailDelay);

    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate3d(${cursorPos.current.x}px, ${cursorPos.current.y}px, 0) translate(-50%, -50%)`;
    }

    if (trailRef.current) {
      trailRef.current.style.transform = `translate3d(${trailPos.current.x}px, ${trailPos.current.y}px, 0) translate(-50%, -50%)`;
    }

    rafId.current = requestAnimationFrame(animate);
  }, [config.trailDelay]);

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
    
    if (!isVisible.current) {
      isVisible.current = true;
      if (cursorRef.current) cursorRef.current.style.opacity = "1";
      if (trailRef.current) trailRef.current.style.opacity = "1";
    }
  }, []);

  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    if (config.hideOnLeave) {
      isVisible.current = false;
      if (cursorRef.current) cursorRef.current.style.opacity = "0";
      if (trailRef.current) trailRef.current.style.opacity = "0";
    }
  }, [config.hideOnLeave]);

  // Mouse enter handler
  const handleMouseEnter = useCallback(() => {
    isVisible.current = true;
    if (cursorRef.current) cursorRef.current.style.opacity = "1";
    if (trailRef.current) trailRef.current.style.opacity = "1";
  }, []);

  // Click handlers
  const handleMouseDown = useCallback(() => {
    isClicking.current = true;
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate3d(${cursorPos.current.x}px, ${cursorPos.current.y}px, 0) translate(-50%, -50%) scale(${config.clickScale})`;
    }
    if (trailRef.current) {
      trailRef.current.style.transform = `translate3d(${trailPos.current.x}px, ${trailPos.current.y}px, 0) translate(-50%, -50%) scale(${config.clickScale})`;
    }
  }, [config.clickScale]);

  const handleMouseUp = useCallback(() => {
    isClicking.current = false;
  }, []);

  // Hover detection using event delegation (High Performance)
  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    
    const isInteractive = target.closest(
      'a, button, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"]), .cursor-pointer'
    );

    if (isInteractive) {
      isHovering.current = true;
      if (cursorRef.current) {
        cursorRef.current.style.width = `${config.cursorSize * config.hoverScale}px`;
        cursorRef.current.style.height = `${config.cursorSize * config.hoverScale}px`;
        cursorRef.current.style.background = config.cursorColor.replace(")", " / 0.5)").replace("oklch(", "oklch(");
      }
      if (trailRef.current) {
        trailRef.current.style.width = `${config.trailSize * config.hoverScale}px`;
        trailRef.current.style.height = `${config.trailSize * config.hoverScale}px`;
        trailRef.current.style.borderColor = "oklch(0.68 0.16 330 / 0.6)"; // accent color
      }
    } else {
      isHovering.current = false;
      if (cursorRef.current) {
        cursorRef.current.style.width = `${config.cursorSize}px`;
        cursorRef.current.style.height = `${config.cursorSize}px`;
        cursorRef.current.style.background = config.cursorColor;
      }
      if (trailRef.current) {
        trailRef.current.style.width = `${config.trailSize}px`;
        trailRef.current.style.height = `${config.trailSize}px`;
        trailRef.current.style.borderColor = config.trailBorderColor;
      }
    }
  }, [config]);

  useEffect(() => {
    // Check for touch device
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice && !config.showOnTouch) {
      return;
    }

    // Hide default cursor
    document.body.style.cursor = "none";

    // Add event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    // Start animation loop
    rafId.current = requestAnimationFrame(animate);

    // Setup event delegation for hover
    document.addEventListener("mouseover", handleMouseOver);

    return () => {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseover", handleMouseOver);
      
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [
    animate,
    handleMouseMove,
    handleMouseLeave,
    handleMouseEnter,
    handleMouseDown,
    handleMouseUp,
    handleMouseOver,
    config.showOnTouch,
  ]);

  // Don't render on server or on touch devices unless explicitly enabled
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice || config.showOnTouch) {
      setShouldRender(true);
    }
  }, [config.showOnTouch]);

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {/* Main cursor dot */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full mix-blend-difference"
        style={{
          width: config.cursorSize,
          height: config.cursorSize,
          background: config.cursorColor,
          borderWidth: config.cursorBorderWidth,
          borderColor: config.cursorBorderColor,
          borderStyle: "solid",
          opacity: 0,
          willChange: "transform",
          transition: "width 0.2s ease, height 0.2s ease, background 0.2s ease, opacity 0.2s ease",
        }}
      />
      
      {/* Trailing cursor ring */}
      <div
        ref={trailRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full"
        style={{
          width: config.trailSize,
          height: config.trailSize,
          background: config.trailColor,
          borderWidth: config.trailBorderWidth,
          borderColor: config.trailBorderColor,
          borderStyle: "solid",
          opacity: 0,
          willChange: "transform",
          transition: "width 0.3s ease, height 0.3s ease, border-color 0.3s ease, opacity 0.3s ease",
        }}
      />
    </>
  );
}
