"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  radius: number;
  alpha: number;
  color: string;
  twinkleSpeed: number;
  phase: number;
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

export function CelestialObservatoryCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    // Mouse parallax & gravitational lensing
    let mouseX = -1000;
    let mouseY = -1000;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let parallaxX = 0;
    let parallaxY = 0;

    const stars: Star[] = [];
    let meteors: Meteor[] = [];
    let lastMeteor = Date.now();

    // Keplerian system parameters
    let orbitAngle1 = 0.4;
    let orbitAngle2 = 2.1;

    // Load Photorealistic Real Sun Asset
    const sunImg = new Image();
    let sunLoaded = false;
    sunImg.src = "/real_sun.jpg";
    sunImg.onload = () => {
      sunLoaded = true;
    };

    const stellarColors = ["#FFFFFF", "#FDE68A", "#FEF3C7", "#BAE6FD", "#F59E0B"];

    function initStars(w: number, h: number) {
      stars.length = 0;
      const count = Math.floor(Math.min(w * 0.14, 200));

      for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const z = 0.2 + Math.random() * 0.8; // Depth layer
        stars.push({
          x,
          y,
          z,
          baseX: x,
          baseY: y,
          radius: (0.6 + Math.random() * 1.5) * z,
          alpha: 0.2 + Math.random() * 0.7,
          color: stellarColors[Math.floor(Math.random() * stellarColors.length)],
          twinkleSpeed: 0.015 + Math.random() * 0.035,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function spawnMeteor() {
      const angle = (Math.PI / 180) * (58 + Math.random() * 16);
      const speed = 16 + Math.random() * 12;
      const length = 140 + Math.random() * 180;
      meteors.push({
        x: Math.random() * (width + 300) - 100,
        y: -50,
        length,
        speed,
        size: 2.2 + Math.random() * 1.4,
        opacity: 0.95,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color: "#FFFFFF",
        active: true,
      });
    }

    function handleResize() {
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect ? rect.width : window.innerWidth;
      height = rect ? rect.height : window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx?.scale(dpr, dpr);

      initStars(width, height);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      targetParallaxX = (mouseX / width - 0.5) * 40;
      targetParallaxY = (mouseY / height - 0.5) * 30;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    let t = 0;

    function render() {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      t += 0.016;

      // Smooth parallax interpolation
      parallaxX += (targetParallaxX - parallaxX) * 0.05;
      parallaxY += (targetParallaxY - parallaxY) * 0.05;

      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space Cosmic Background Gradient
      const spaceGrad = ctx.createRadialGradient(
        width * 0.75 - parallaxX * 0.3,
        height * 0.35 - parallaxY * 0.3,
        40,
        width * 0.7,
        height * 0.4,
        Math.max(width, height) * 0.8
      );
      spaceGrad.addColorStop(0, "rgba(217, 119, 6, 0.12)"); // Solar amber coronal aura
      spaceGrad.addColorStop(0.25, "rgba(30, 27, 75, 0.25)"); // Indigo deep space
      spaceGrad.addColorStop(0.65, "rgba(7, 9, 13, 0.85)"); // Deep velvet void
      spaceGrad.addColorStop(1, "#07090D");

      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Astrometric Coordinate Grid (Telescopic reticle background)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 120;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Draw Stars & Constellation Lines
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.phase += s.twinkleSpeed;
        const twinkle = 0.5 + 0.5 * Math.sin(s.phase);

        // Gravitational lens deflection near cursor
        let renderX = s.baseX + parallaxX * s.z;
        let renderY = s.baseY + parallaxY * s.z;

        if (mouseX > 0) {
          const dx = mouseX - renderX;
          const dy = mouseY - renderY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist > 1) {
            const pull = (1 - dist / 180) * 8 * s.z;
            renderX += (dx / dist) * pull;
            renderY += (dy / dist) * pull;
          }
        }

        // Draw star
        ctx.beginPath();
        ctx.arc(renderX, renderY, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha * twinkle;
        ctx.fill();

        // Connect nearby stars with faint constellation bonds (only in upper/right quadrant)
        if (renderX > width * 0.35) {
          for (let j = i + 1; j < Math.min(i + 5, stars.length); j++) {
            const s2 = stars[j];
            const dist = Math.hypot(s.baseX - s2.baseX, s.baseY - s2.baseY);
            if (dist < 65) {
              ctx.beginPath();
              ctx.moveTo(renderX, renderY);
              ctx.lineTo(s2.baseX + parallaxX * s2.z, s2.baseY + parallaxY * s2.z);
              ctx.strokeStyle = "rgba(245, 158, 11, 0.08)";
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }

      // 4. THE REAL PHOTOREALISTIC SUN (NASA SDO Solar Furnace)
      // Positioned with generous breathing room in the upper-right quadrant
      const starCenterX = width * (width < 768 ? 0.8 : 0.82) - parallaxX * 0.4;
      const starCenterY = height * (width < 768 ? 0.28 : 0.33) - parallaxY * 0.4;
      const sunRadius = width < 768 ? 72 : 115;
      const starBaseRadius = sunRadius;

      // Coronal Flare Pulses
      const pulse1 = Math.sin(t * 1.8) * 6;
      const pulse2 = Math.cos(t * 2.4) * 8;

      // Volumetric Coronal Glow
      const coronaGrad = ctx.createRadialGradient(
        starCenterX,
        starCenterY,
        sunRadius * 0.3,
        starCenterX,
        starCenterY,
        sunRadius * 2.4 + pulse1
      );
      coronaGrad.addColorStop(0, "rgba(254, 243, 199, 0.75)");
      coronaGrad.addColorStop(0.2, "rgba(245, 158, 11, 0.45)");
      coronaGrad.addColorStop(0.55, "rgba(217, 119, 6, 0.15)");
      coronaGrad.addColorStop(0.85, "rgba(217, 119, 6, 0.03)");
      coronaGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.beginPath();
      ctx.arc(starCenterX, starCenterY, sunRadius * 2.4 + pulse1, 0, Math.PI * 2);
      ctx.fillStyle = coronaGrad;
      ctx.globalAlpha = 1;
      ctx.fill();

      // Render the Real Photorealistic Sun with Circular Mask & Axial Rotation (Zero Square Box)
      if (sunLoaded) {
        ctx.save();
        ctx.translate(starCenterX, starCenterY);

        // Circular clipping mask: physically eliminates any square corners or image box boundaries
        ctx.beginPath();
        ctx.arc(0, 0, sunRadius * 0.88, 0, Math.PI * 2);
        ctx.clip();

        // Majestic slow axial solar rotation inside the circular aperture
        ctx.rotate(t * 0.03);
        ctx.drawImage(
          sunImg,
          -sunRadius,
          -sunRadius,
          sunRadius * 2,
          sunRadius * 2
        );
        ctx.restore();

        // Soft Solar Limb Darkening / Coronal Blending Ring
        ctx.save();
        ctx.translate(starCenterX, starCenterY);
        const rimGrad = ctx.createRadialGradient(
          0,
          0,
          sunRadius * 0.72,
          0,
          0,
          sunRadius * 0.92
        );
        rimGrad.addColorStop(0, "rgba(245, 158, 11, 0)");
        rimGrad.addColorStop(0.7, "rgba(245, 158, 11, 0.4)");
        rimGrad.addColorStop(1, "rgba(217, 119, 6, 0.9)");

        ctx.beginPath();
        ctx.arc(0, 0, sunRadius * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = rimGrad;
        ctx.fill();
        ctx.restore();
      } else {
        // Fallback glowing core while loading
        const fallbackGrad = ctx.createRadialGradient(
          starCenterX,
          starCenterY,
          2,
          starCenterX,
          starCenterY,
          sunRadius
        );
        fallbackGrad.addColorStop(0, "#FFFFFF");
        fallbackGrad.addColorStop(0.65, "#FDE68A");
        fallbackGrad.addColorStop(1, "#D97706");

        ctx.beginPath();
        ctx.arc(starCenterX, starCenterY, sunRadius * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = fallbackGrad;
        ctx.fill();
      }

      // 5. KEPLERIAN 3D TRANSIT ORBITS & EXOPLANETS
      // Orbit 1: Kepler-10b (Primary Transiting Ultra-Short Period Planet)
      const a1 = width < 768 ? 140 : 230; // Semi-major axis
      const b1 = width < 768 ? 40 : 66; // Semi-minor axis (inclination angle tilt ~ 88°)
      const orbitTilt = -0.22; // Tilt angle

      // Draw Orbit 1 Path (Astronomical dashed Keplerian trajectory)
      ctx.save();
      ctx.translate(starCenterX, starCenterY);
      ctx.rotate(orbitTilt);
      ctx.beginPath();
      ctx.ellipse(0, 0, a1, b1, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.22)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Advance Kepler-10b position along orbit
      orbitAngle1 += 0.022; // Orbit velocity
      const p1X = Math.cos(orbitAngle1) * a1;
      const p1Y = Math.sin(orbitAngle1) * b1;
      const isTransiting1 = Math.sin(orbitAngle1) > 0 && Math.abs(p1X) < sunRadius * 0.85;

      // Orbit 2: Kepler-10c (Outer Warm Neptune Companion)
      const a2 = width < 768 ? 250 : 390;
      const b2 = width < 768 ? 75 : 115;
      ctx.beginPath();
      ctx.ellipse(0, 0, a2, b2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.16)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      orbitAngle2 += 0.008;
      const p2X = Math.cos(orbitAngle2) * a2;
      const p2Y = Math.sin(orbitAngle2) * b2;

      // Draw Kepler-10c (Outer planet with cyan-tinted ring)
      ctx.beginPath();
      ctx.arc(p2X, p2Y, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#0C1322";
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Tiny moon / satellite orbiting Kepler-10c
      const moonX = p2X + Math.cos(t * 4) * 16;
      const moonY = p2Y + Math.sin(t * 4) * 8;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#BAE6FD";
      ctx.fill();

      // Draw Kepler-10b (Transiting world)
      const planetRadius = 5.5;
      ctx.beginPath();
      ctx.arc(p1X, p1Y, planetRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#090D14";
      ctx.strokeStyle = isTransiting1 ? "#F59E0B" : "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.4;
      ctx.fill();
      ctx.stroke();

      // Transit Flash Indicator when planet eclipses host star
      if (isTransiting1) {
        ctx.beginPath();
        ctx.arc(p1X, p1Y, 14 + pulse2 * 0.4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();

      // 6. Astrometric Target Reticle Callout for Kepler-10
      const reticleX = starCenterX + (width < 768 ? 55 : 85);
      const reticleY = starCenterY - (width < 768 ? 45 : 70);

      ctx.beginPath();
      ctx.moveTo(starCenterX + starBaseRadius * 0.8, starCenterY - starBaseRadius * 0.6);
      ctx.lineTo(reticleX, reticleY);
      ctx.lineTo(reticleX + 90, reticleY);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Reticle Box
      ctx.fillStyle = "rgba(7, 9, 13, 0.85)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(reticleX + 10, reticleY - 18, 96, 26);
      ctx.strokeRect(reticleX + 10, reticleY - 18, 96, 26);

      ctx.fillStyle = "#FDE68A";
      ctx.font = "9px monospace";
      ctx.fillText("HOST STAR · G-TYPE", reticleX + 16, reticleY - 6);
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText("T_eff = 5705 K", reticleX + 16, reticleY + 4);

      // 7. Occasional Meteors (Shooting stars)
      const now = Date.now();
      if (now - lastMeteor > 2400 + Math.random() * 2600) {
        spawnMeteor();
        lastMeteor = now;
      }

      for (const m of meteors) {
        if (!m.active) continue;

        const tailX = m.x - (m.dx / m.speed) * m.length;
        const tailY = m.y - (m.dy / m.speed) * m.length;

        const meteorGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        meteorGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        meteorGrad.addColorStop(0.6, "rgba(245, 158, 11, 0.5)");
        meteorGrad.addColorStop(1, "#FFFFFF");

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = meteorGrad;
        ctx.lineWidth = m.size;
        ctx.lineCap = "round";
        ctx.globalAlpha = m.opacity;
        ctx.stroke();

        m.x += m.dx;
        m.y += m.dy;
        m.opacity -= 0.012;

        if (m.y > height + 100 || m.opacity <= 0) {
          m.active = false;
        }
      }

      meteors = meteors.filter((m) => m.active);
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none w-full h-full z-0 ${className}`}
    />
  );
}
