import React, { useEffect, useRef } from 'react';

/**
 * FallingStarsSnow
 * High-performance animated background featuring many falling stars & snowflakes.
 * Renders on a smooth 60 FPS HTML5 canvas with zero DOM overhead and pointer-events: none.
 */
export default function FallingStarsSnow({ theme = 'light' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Particle count: ~110 on desktop, ~60 on mobile
    const count = window.innerWidth < 768 ? 60 : 120;

    // Helper to generate a particle
    const createParticle = (spawnAtTop = false) => {
      // 0: 6-arm crystal snowflake, 1: fluffy snow dot, 2: 4-pointed golden/silver star, 3: twinkling stardust
      const typeChoice = Math.random();
      let type = 'snow_dot';
      if (typeChoice < 0.3) type = 'snow_crystal';
      else if (typeChoice < 0.6) type = 'star_sparkle';
      else if (typeChoice < 0.8) type = 'star_twinkle';
      else type = 'snow_dot';

      const isStar = type.startsWith('star');

      return {
        type,
        x: Math.random() * width,
        y: spawnAtTop ? -20 - Math.random() * 30 : Math.random() * height,
        size:
          type === 'snow_crystal'
            ? 5 + Math.random() * 6
            : type === 'star_sparkle'
            ? 4 + Math.random() * 6
            : type === 'star_twinkle'
            ? 1.5 + Math.random() * 2.5
            : 2 + Math.random() * 3.5,
        speedY:
          type === 'snow_crystal'
            ? 0.7 + Math.random() * 1.1
            : isStar
            ? 0.9 + Math.random() * 1.5
            : 0.5 + Math.random() * 1.2,
        swayAmount: 0.4 + Math.random() * 0.9,
        swaySpeed: 0.015 + Math.random() * 0.025,
        angle: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        opacity: isStar ? 0.45 + Math.random() * 0.5 : 0.35 + Math.random() * 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.03 + Math.random() * 0.05,
        colorType: isStar
          ? Math.random() > 0.45
            ? 'gold'
            : 'silver'
          : Math.random() > 0.3
          ? 'white'
          : 'ice_blue',
      };
    };

    const particles = Array.from({ length: count }, () => createParticle(false));

    // Drawing helper for 6-arm crystal snowflake
    const drawSnowflake = (x, y, size, rotation, opacity, isDark) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = isDark
        ? `rgba(255, 255, 255, ${opacity})`
        : `rgba(180, 205, 230, ${Math.min(1, opacity + 0.2)})`;
      ctx.lineWidth = Math.max(1, size * 0.12);
      ctx.lineCap = 'round';

      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, size);
        if (size > 6) {
          ctx.moveTo(0, size * 0.55);
          ctx.lineTo(-size * 0.25, size * 0.75);
          ctx.moveTo(0, size * 0.55);
          ctx.lineTo(size * 0.25, size * 0.75);
        }
        ctx.stroke();
        ctx.rotate(Math.PI / 3);
      }
      ctx.restore();
    };

    // Drawing helper for 4-point diamond star
    const drawStar = (x, y, size, rotation, opacity, colorType, isDark) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      let fill = '';
      if (colorType === 'gold') {
        fill = isDark
          ? `rgba(245, 205, 120, ${opacity})`
          : `rgba(201, 169, 110, ${Math.min(1, opacity + 0.25)})`;
      } else {
        fill = isDark
          ? `rgba(255, 255, 255, ${opacity})`
          : `rgba(160, 185, 215, ${Math.min(1, opacity + 0.2)})`;
      }

      ctx.fillStyle = fill;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(0, size);
        ctx.quadraticCurveTo(0, size * 0.18, size * 0.18, 0);
        ctx.rotate(Math.PI / 2);
      }
      ctx.closePath();
      ctx.fill();

      // Bright center core
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, size * 0.22), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, opacity + 0.3)})`;
      ctx.fill();

      ctx.restore();
    };

    // Drawing helper for fluffy snow dot or stardust
    const drawDot = (x, y, radius, opacity, colorType, isDark) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (colorType === 'gold') {
        ctx.fillStyle = isDark
          ? `rgba(245, 205, 120, ${opacity})`
          : `rgba(201, 169, 110, ${opacity})`;
      } else if (colorType === 'ice_blue') {
        ctx.fillStyle = isDark
          ? `rgba(215, 235, 255, ${opacity})`
          : `rgba(165, 195, 225, ${opacity})`;
      } else {
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${opacity})`
          : `rgba(190, 210, 230, ${opacity})`;
      }

      ctx.fill();
      ctx.restore();
    };

    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min(2.0, (time - lastTime) / 16.67);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Motion physics: fall downwards with horizontal breeze/sway
        p.angle += p.swaySpeed * dt;
        p.x += Math.sin(p.angle) * p.swayAmount * dt + 0.2 * dt;
        p.y += p.speedY * dt;
        p.rotation += p.rotSpeed * dt;
        p.twinklePhase += p.twinkleSpeed * dt;

        // Dynamic twinkling opacity
        const currentOpacity = Math.max(
          0.15,
          Math.min(1, p.opacity + Math.sin(p.twinklePhase) * 0.25)
        );

        // Render based on particle type
        if (p.type === 'snow_crystal') {
          drawSnowflake(p.x, p.y, p.size, p.rotation, currentOpacity, isDark);
        } else if (p.type === 'star_sparkle') {
          drawStar(p.x, p.y, p.size, p.rotation, currentOpacity, p.colorType, isDark);
        } else {
          drawDot(p.x, p.y, p.size, currentOpacity, p.colorType, isDark);
        }

        // Respawn when falling out of bounds
        if (p.y > height + 25) {
          p.y = -20 - Math.random() * 20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 25) {
          p.x = -20;
        } else if (p.x < -25) {
          p.x = width + 20;
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Pause animation when tab is not active to save battery/resources
    const handleVisibility = () => {
      if (document.hidden) {
        if (animId) cancelAnimationFrame(animId);
      } else {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="falling-stars-snow-canvas"
      aria-hidden="true"
    />
  );
}
