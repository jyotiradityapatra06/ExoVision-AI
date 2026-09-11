"use client";

import React, { useEffect, useRef } from "react";

interface FallingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  angle: number; // in radians
  color: string;
  tailColor: string;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  size: number;
  opacity: number;
  dx: number;
  dy: number;
  color: string;
  active: boolean;
}

interface TwinkleStar {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  pulseSpeed: number;
  phase: number;
  color: string;
}

export function FallingStarsBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const colors = [
      { head: "#FFFFFF", tail: "rgba(255, 255, 255, 0)" },
      { head: "#FDE68A", tail: "rgba(245, 158, 11, 0)" }, // Amber-gold
      { head: "#BAE6FD", tail: "rgba(56, 189, 248, 0)" }, // Ice-blue
      { head: "#FEF3C7", tail: "rgba(251, 191, 36, 0)" }, // Warm ivory
    ];

    const fallingStars: FallingStar[] = [];
    const twinkleStars: TwinkleStar[] = [];
    let meteors: Meteor[] = [];
    let lastMeteorTime = Date.now();

    function initElements(w: number, h: number) {
      fallingStars.length = 0;
      twinkleStars.length = 0;
      meteors = [];

      // Denser particle field for rich cosmic depth
      const starCount = Math.floor(Math.min(w * 0.12, 175));
      const twinkleCount = Math.floor(Math.min(w * 0.08, 110));

      // 1. Abundant falling stars cascading briskly downward
      for (let i = 0; i < starCount; i++) {
        const theme = colors[Math.floor(Math.random() * colors.length)];
        const angle = (Math.PI / 180) * (68 + Math.random() * 14); // Realistic downward cosmic trajectory
        const speed = 2.8 + Math.random() * 4.4; // Brisk, energetic fall speed
        fallingStars.push({
          x: Math.random() * (w + 250) - 120,
          y: Math.random() * h,
          length: 28 + Math.random() * 65, // Longer starlight trail
          speed,
          size: 1.2 + Math.random() * 1.6,
          opacity: 0.35 + Math.random() * 0.6,
          baseOpacity: 0.35 + Math.random() * 0.6,
          angle,
          color: theme.head,
          tailColor: theme.tail,
        });
      }

      // 2. Luminous background starfield twinkle nodes
      for (let i = 0; i < twinkleCount; i++) {
        const theme = colors[Math.floor(Math.random() * colors.length)];
        twinkleStars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: 0.8 + Math.random() * 1.5,
          opacity: 0.25 + Math.random() * 0.75,
          pulseSpeed: 0.02 + Math.random() * 0.04,
          phase: Math.random() * Math.PI * 2,
          color: theme.head,
        });
      }
    }

    function spawnMeteor() {
      const angle = (Math.PI / 180) * (62 + Math.random() * 14);
      const speed = 18 + Math.random() * 14;
      const length = 160 + Math.random() * 200;
      const theme = colors[Math.floor(Math.random() * colors.length)];

      meteors.push({
        x: Math.random() * (width + 350) - 120,
        y: -60,
        length,
        speed,
        size: 2.6 + Math.random() * 1.4,
        opacity: 0.95,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color: theme.head,
        active: true,
      });
    }

    function handleResize() {
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      const newWidth = rect ? rect.width : window.innerWidth;
      const newHeight = rect ? rect.height : window.innerHeight * 2;

      width = newWidth;
      height = newHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx?.scale(dpr, dpr);

      initElements(width, height);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    function render() {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx?.clearRect(0, 0, width, height);

      // A. Draw subtle background twinkle stars
      for (const ts of twinkleStars) {
        ts.phase += ts.pulseSpeed;
        const currentOpacity = ts.opacity * (0.5 + 0.5 * Math.sin(ts.phase));

        if (ctx) {
          ctx.beginPath();
          ctx.arc(ts.x, ts.y, ts.radius, 0, Math.PI * 2);
          ctx.fillStyle = ts.color;
          ctx.globalAlpha = currentOpacity;
          ctx.fill();
        }
      }

      // B. Draw falling stars with trails
      for (const star of fallingStars) {
        const tailX = star.x - Math.cos(star.angle) * star.length;
        const tailY = star.y - Math.sin(star.angle) * star.length;

        if (ctx) {
          const grad = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
          grad.addColorStop(0, star.tailColor);
          grad.addColorStop(0.7, star.color);
          grad.addColorStop(1, "#FFFFFF");

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(star.x, star.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = star.size;
          ctx.lineCap = "round";
          ctx.globalAlpha = star.opacity;
          ctx.stroke();

          // Bright star head dot
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.globalAlpha = Math.min(star.opacity * 1.3, 1);
          ctx.fill();
        }

        // Advance position
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;

        // Reset if off-canvas
        if (star.y > height + 50 || star.x > width + 100) {
          star.x = Math.random() * (width + 200) - 100;
          star.y = -star.length - Math.random() * 50;
          star.opacity = star.baseOpacity;
        }
      }

      // C. Periodic shooting star / meteor streak
      const now = Date.now();
      if (now - lastMeteorTime > 1400 + Math.random() * 2000) {
        spawnMeteor();
        lastMeteorTime = now;
      }

      for (const m of meteors) {
        if (!m.active) continue;

        const tailX = m.x - (m.dx / m.speed) * m.length;
        const tailY = m.y - (m.dy / m.speed) * m.length;

        if (ctx) {
          const meteorGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
          meteorGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
          meteorGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.4)");
          meteorGrad.addColorStop(0.9, "rgba(255, 255, 255, 0.8)");
          meteorGrad.addColorStop(1, "#FFFFFF");

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(m.x, m.y);
          ctx.strokeStyle = meteorGrad;
          ctx.lineWidth = m.size;
          ctx.lineCap = "round";
          ctx.globalAlpha = m.opacity;
          ctx.stroke();

          // Head glow
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#F59E0B";
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size * 1.4, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }

        m.x += m.dx;
        m.y += m.dy;
        m.opacity -= 0.009;

        if (m.y > height + 100 || m.opacity <= 0) {
          m.active = false;
        }
      }

      meteors = meteors.filter((m) => m.active);

      if (ctx) {
        ctx.globalAlpha = 1;
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none z-0 w-full h-full ${className}`}
    />
  );
}
