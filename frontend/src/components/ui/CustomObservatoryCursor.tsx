"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";

export function CustomObservatoryCursor() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  // Exact mouse position for instant central dot
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth spring physics for trailing observatory reticle
  const springConfig = { damping: 26, stiffness: 320, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only activate on the landing page, never on auth/login or workspace forms
    if (pathname !== "/") return;

    // Only activate for devices with fine pointer (mouse/trackpad), not touch screens
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!media.matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsVisible(true);

      // Check if hovering interactive target
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest(
            "a, button, input, select, textarea, [role='button'], label, [data-interactive='true'], .cursor-pointer, .cursor-crosshair"
          )
        );
        setIsHovered(isInteractive);
      }
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [cursorX, cursorY, isVisible, pathname]);

  if (!isVisible || pathname !== "/") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden hidden [@media(hover:hover)_and_(pointer:fine)]:block">
      {/* 1. Trailing Astronomical Reticle Ring */}
      <motion.div
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isClicked ? 0.85 : isHovered ? 1.6 : 1,
          rotate: isHovered ? 45 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`absolute rounded-full transition-colors duration-200 flex items-center justify-center ${
          isHovered
            ? "w-10 h-10 border border-amber-400 bg-amber-400/[0.12] shadow-[0_0_20px_rgba(245,158,11,0.5)]"
            : "w-8 h-8 border border-white/40 bg-white/[0.03] shadow-[0_0_12px_rgba(0,0,0,0.5)]"
        }`}
      >
        {/* Telescopic Crosshair Reticle Ticks when targeting interactive elements */}
        {isHovered && (
          <>
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-amber-400 rounded-full" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-amber-400 rounded-full" />
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-amber-400 rounded-full" />
            <span className="absolute -right-1 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-amber-400 rounded-full" />
          </>
        )}
      </motion.div>

      {/* 2. Instant Central Starlight Dot */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isClicked ? 0.6 : isHovered ? 1.3 : 1,
        }}
        transition={{ duration: 0.1 }}
        className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"
      />
    </div>
  );
}
