import { useCallback, useEffect, useRef } from "react";
import { useGameEngine } from "../hooks/useGameEngine";

interface GameScreenProps {
  onGameOver: (score: number, coins: number) => void;
}

const CANVAS_W = 400;
const CANVAS_H = 700;

export default function GameScreen({ onGameOver }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const { stateRef, reset, actions, tick } = useGameEngine();

  // Touch tracking
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Images
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const boyImgRef = useRef<HTMLImageElement | null>(null);

  // Load images once
  useEffect(() => {
    const bg = new Image();
    bg.src = "/assets/generated/zoo-background.dim_1200x400.jpg";
    bgImgRef.current = bg;

    const boy = new Image();
    boy.src = "/assets/generated/boy-character-transparent.dim_512x256.png";
    boyImgRef.current = boy;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, dpr: number) => {
      const s = stateRef.current;
      const W = CANVAS_W;
      const H = CANVAS_H;

      ctx.save();
      ctx.scale(dpr, dpr);

      // ── Layer 1: Sky gradient ──────────────────────────────────────────────
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.45);
      skyGrad.addColorStop(0, "#0a1a3d");
      skyGrad.addColorStop(0.5, "#1a3a7a");
      skyGrad.addColorStop(1, "#2a5fa8");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H * 0.45);

      // Clouds
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      const cloudPositions = [
        { x: s.cloudOffset % W, y: 40, w: 80, h: 30 },
        { x: (s.cloudOffset + 180) % W, y: 70, w: 60, h: 22 },
        { x: (s.cloudOffset + 320) % W, y: 30, w: 100, h: 35 },
        { x: ((s.cloudOffset + 500) % W) - 20, y: 60, w: 70, h: 25 },
      ];
      for (const c of cloudPositions) {
        drawCloud(ctx, c.x, c.y, c.w, c.h);
        // Wrap-around duplicate
        if (c.x > W - c.w - 20) {
          drawCloud(ctx, c.x - W, c.y, c.w, c.h);
        }
      }
      ctx.restore();

      // ── Layer 2: Zoo background scrolling image ───────────────────────────
      const bgImg = bgImgRef.current;
      const bgBand = { y: H * 0.18, h: H * 0.27 };
      if (bgImg?.complete && bgImg.naturalWidth > 0) {
        const scale = bgBand.h / bgImg.naturalHeight;
        const scaledW = bgImg.naturalWidth * scale;
        const offset = s.bgOffset % scaledW;
        ctx.drawImage(bgImg, -offset, bgBand.y, scaledW, bgBand.h);
        if (offset > 0) {
          ctx.drawImage(bgImg, scaledW - offset, bgBand.y, scaledW, bgBand.h);
        }
      } else {
        // Fallback painted zoo background
        drawFallbackZooBg(ctx, W, bgBand.y, bgBand.h, s.bgOffset);
      }

      // Animated animals in the bg
      for (const animal of s.animals) {
        drawAnimal(
          ctx,
          animal.type,
          animal.x,
          bgBand.y + bgBand.h * 0.55,
          animal.frame,
        );
      }

      // ── Ground / grass strip ─────────────────────────────────────────────
      const grassGrad = ctx.createLinearGradient(0, H * 0.43, 0, H * 0.48);
      grassGrad.addColorStop(0, "#3d9e2a");
      grassGrad.addColorStop(1, "#2d7a1a");
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, H * 0.43, W, H * 0.05);

      // ── Layer 3: Road ─────────────────────────────────────────────────────
      const roadTop = H * 0.45;
      const roadH = H - roadTop;
      const laneW = W / 3;

      // Road base with perspective
      const roadGrad = ctx.createLinearGradient(0, roadTop, 0, H);
      roadGrad.addColorStop(0, "#5a5a6a");
      roadGrad.addColorStop(1, "#888898");
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, roadTop, W, roadH);

      // Lane dividers (dashed)
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 15]);
      const dashOffset = (s.frame * s.gameSpeed) % 35;
      ctx.lineDashOffset = -dashOffset;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(laneW * i, roadTop);
        ctx.lineTo(laneW * i, H);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Road edge lines
      ctx.strokeStyle = "rgba(255,220,50,0.8)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(2, roadTop);
      ctx.lineTo(2, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W - 2, roadTop);
      ctx.lineTo(W - 2, H);
      ctx.stroke();

      // ── Lane X centers ────────────────────────────────────────────────────
      const laneXCenters = [laneW * 0.5, laneW * 1.5, laneW * 2.5];

      // ── Obstacles ─────────────────────────────────────────────────────────
      for (const obs of s.obstacles) {
        const ox = laneXCenters[obs.lane];
        drawObstacle(ctx, obs.type, ox, obs.y, obs.width, obs.height, laneW);
      }

      // ── Energy pickups ────────────────────────────────────────────────────
      for (const ep of s.energyPickups) {
        const ex = laneXCenters[ep.lane];
        drawEnergyPickup(ctx, ex, ep.y, s.frame);
      }

      // ── Coins ─────────────────────────────────────────────────────────────
      for (const coin of s.coinItems) {
        const cx = laneXCenters[coin.lane];
        drawCoin(ctx, cx, coin.y, s.frame);
      }

      // ── Player ────────────────────────────────────────────────────────────
      const playerX = laneXCenters[s.lane];
      const playerBaseY = H * 0.65;
      const playerDrawY = playerBaseY + s.playerY;
      const isHit = s.hitFrame > 0;
      const isInvincible = s.invincibleFrame > 0;

      // Determine pose
      let pose = 0; // run
      if (s.isJumping) pose = 1;
      else if (s.isSliding) pose = 2;
      else if (isHit) pose = 3;

      const boyImg = boyImgRef.current;
      const pW = s.isSliding ? 90 : 70;
      const pH = s.isSliding ? 50 : 110;

      // Invincible flicker
      const shouldDraw = !isInvincible || s.frame % 4 < 3;

      if (shouldDraw) {
        if (boyImg?.complete && boyImg.naturalWidth > 0) {
          // Sprite sheet: 4 poses × 128px wide, 256px tall
          const srcX = pose * 128;
          const srcY = 0;
          const srcW = 128;
          const srcH = 256;

          ctx.save();
          if (isHit) {
            ctx.filter = "sepia(1) saturate(8) hue-rotate(-20deg)";
          }
          ctx.drawImage(
            boyImg,
            srcX,
            srcY,
            srcW,
            srcH,
            playerX - pW / 2,
            playerDrawY - pH,
            pW,
            pH,
          );
          ctx.filter = "none";
          ctx.restore();
        } else {
          // Fallback boy
          drawFallbackBoy(ctx, playerX, playerDrawY, pW, pH, pose, isHit);
        }
      }

      // Shadow under player
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(playerX, playerBaseY + 2, pW * 0.45, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── HUD ───────────────────────────────────────────────────────────────
      drawHUD(ctx, W, s.score, s.coins, s.energy);

      ctx.restore();
    },
    [stateRef],
  );

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    tick(CANVAS_W, CANVAS_H, onGameOver);
    draw(ctx, dpr);

    if (stateRef.current.isAlive) {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [tick, draw, stateRef, onGameOver]);

  useEffect(() => {
    reset();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [reset, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          actions.jump();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          actions.slide();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          actions.moveLeft();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          actions.moveRight();
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [actions]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy) {
        if (dx < -50) actions.moveLeft();
        else if (dx > 50) actions.moveRight();
      } else {
        if (dy < -50) actions.jump();
        else if (dy > 50) actions.slide();
      }
      touchStartRef.current = null;
    },
    [actions],
  );

  // On-screen button handlers
  const handleJump = useCallback(() => actions.jump(), [actions]);
  const handleSlide = useCallback(() => actions.slide(), [actions]);
  const handleLeft = useCallback(() => actions.moveLeft(), [actions]);
  const handleRight = useCallback(() => actions.moveRight(), [actions]);

  return (
    <div className="game-wrapper" data-ocid="game.canvas_target">
      <div
        style={{
          position: "relative",
          width: CANVAS_W,
          maxWidth: "100vw",
          height: CANVAS_H,
          maxHeight: "100dvh",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            touchAction: "none",
            borderRadius: "12px",
            boxShadow: "0 0 40px rgba(0,0,0,0.8)",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          tabIndex={0}
          aria-label="Busy Zoo game canvas"
        />

        {/* On-screen controls */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            padding: "0 12px",
            pointerEvents: "none",
          }}
        >
          {/* Left/Right */}
          <div style={{ display: "flex", gap: 8, pointerEvents: "all" }}>
            <ControlBtn onClick={handleLeft} label="←" />
            <ControlBtn onClick={handleRight} label="→" />
          </div>

          {/* Jump / Slide */}
          <div style={{ display: "flex", gap: 8, pointerEvents: "all" }}>
            <ControlBtn onClick={handleSlide} label="↓" color="#f59e0b" />
            <ControlBtn onClick={handleJump} label="↑" color="#22c55e" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Control button ────────────────────────────────────────────────────────────
function ControlBtn({
  onClick,
  label,
  color = "#6366f1",
}: {
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.3)",
        background: `${color}bb`,
        color: "#fff",
        fontSize: 22,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
      }}
    >
      {label}
    </button>
  );
}

// ── Canvas drawing helpers ────────────────────────────────────────────────────

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.beginPath();
  ctx.ellipse(x + w * 0.3, y + h * 0.5, w * 0.3, h * 0.5, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.6, y + h * 0.4, w * 0.35, h * 0.6, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.85, y + h * 0.55, w * 0.2, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawAnimal(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
  frame: number,
) {
  const legOsc = Math.sin(frame * Math.PI * 2) * 3;
  ctx.save();
  ctx.globalAlpha = 0.85;
  switch (type) {
    case "elephant":
      drawElephant(ctx, x, y, legOsc);
      break;
    case "giraffe":
      drawGiraffe(ctx, x, y, legOsc);
      break;
    case "monkey":
      drawMonkey(ctx, x, y, legOsc);
      break;
    case "lion":
      drawLion(ctx, x, y, legOsc);
      break;
  }
  ctx.restore();
}

function drawElephant(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  legOsc: number,
) {
  // Body
  ctx.fillStyle = "#7a7a8a";
  ctx.beginPath();
  ctx.ellipse(x, y, 30, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.ellipse(x + 28, y - 5, 18, 16, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Trunk
  ctx.strokeStyle = "#7a7a8a";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + 44, y - 2);
  ctx.quadraticCurveTo(x + 52, y + 10, x + 46, y + 18);
  ctx.stroke();
  // Ear
  ctx.fillStyle = "#9a6060";
  ctx.beginPath();
  ctx.ellipse(x + 24, y - 12, 8, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.fillStyle = "#6a6a7a";
  const legs = [-18, -6, 6, 18];
  for (let i = 0; i < legs.length; i++) {
    const lx = legs[i];
    const lo = i % 2 === 0 ? legOsc : -legOsc;
    ctx.fillRect(x + lx - 5, y + 15 + lo, 10, 14);
  }
  // Eye
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x + 35, y - 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(x + 36, y - 8, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawGiraffe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  legOsc: number,
) {
  // Legs
  ctx.fillStyle = "#c89a3a";
  const legOffsets = [-12, -4, 4, 12];
  for (let i = 0; i < legOffsets.length; i++) {
    const lx = legOffsets[i];
    const lo = i % 2 === 0 ? legOsc : -legOsc;
    ctx.fillRect(x + lx - 4, y + 10 + lo, 8, 20);
  }
  // Body
  ctx.fillStyle = "#e8b84a";
  ctx.beginPath();
  ctx.ellipse(x, y, 20, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  // Neck
  ctx.fillStyle = "#e8b84a";
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 10);
  ctx.lineTo(x + 16, y - 50);
  ctx.lineTo(x + 24, y - 50);
  ctx.lineTo(x + 18, y - 10);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.ellipse(x + 20, y - 56, 10, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Spots
  ctx.fillStyle = "#a06020";
  const spots: [number, number, number][] = [
    [x - 5, y - 5, 5],
    [x + 5, y, 4],
    [x - 8, y + 5, 3],
  ];
  for (const [sx, sy, sr] of spots) {
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  // Horns
  ctx.fillStyle = "#805010";
  ctx.fillRect(x + 17, y - 64, 4, 8);
  ctx.fillRect(x + 23, y - 64, 4, 8);
}

function drawMonkey(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  legOsc: number,
) {
  // Body
  ctx.fillStyle = "#8b5e3c";
  ctx.beginPath();
  ctx.ellipse(x, y, 14, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.ellipse(x, y - 22, 13, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Face
  ctx.fillStyle = "#d4956b";
  ctx.beginPath();
  ctx.ellipse(x, y - 19, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(x - 4, y - 23, 2, 0, Math.PI * 2);
  ctx.arc(x + 4, y - 23, 2, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.fillStyle = "#8b5e3c";
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 10 + legOsc);
  ctx.lineTo(x - 14, y + 28);
  ctx.stroke();
  ctx.strokeStyle = "#8b5e3c";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 8);
  ctx.lineTo(x - 14, y + 28 + legOsc);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 8);
  ctx.lineTo(x + 14, y + 28 - legOsc);
  ctx.stroke();
  // Tail
  ctx.strokeStyle = "#8b5e3c";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + 12, y);
  ctx.quadraticCurveTo(x + 28, y - 10, x + 24, y - 28);
  ctx.stroke();
}

function drawLion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  legOsc: number,
) {
  // Legs
  ctx.fillStyle = "#c8922a";
  const legOffsets = [-12, -4, 4, 12];
  for (let i = 0; i < legOffsets.length; i++) {
    const lx = legOffsets[i];
    const lo = i % 2 === 0 ? legOsc : -legOsc;
    ctx.fillRect(x + lx - 4, y + 10 + lo, 8, 14);
  }
  // Body
  ctx.fillStyle = "#daa848";
  ctx.beginPath();
  ctx.ellipse(x, y, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Mane
  ctx.fillStyle = "#8b4a10";
  ctx.beginPath();
  ctx.arc(x - 16, y - 10, 18, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = "#daa848";
  ctx.beginPath();
  ctx.arc(x - 16, y - 12, 14, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(x - 22, y - 15, 2.5, 0, Math.PI * 2);
  ctx.arc(x - 11, y - 15, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Nose
  ctx.fillStyle = "#f07050";
  ctx.beginPath();
  ctx.ellipse(x - 16, y - 9, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tail
  ctx.strokeStyle = "#c8922a";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + 22, y - 5);
  ctx.quadraticCurveTo(x + 38, y - 20, x + 34, y - 35);
  ctx.stroke();
}

function drawFallbackZooBg(
  ctx: CanvasRenderingContext2D,
  W: number,
  bandY: number,
  bandH: number,
  offset: number,
) {
  // Green park background
  ctx.fillStyle = "#3a7d2a";
  ctx.fillRect(0, bandY, W, bandH);

  // Some trees
  for (let i = 0; i < 5; i++) {
    const tx = ((i * 220 + W - offset * 0.5) % (W + 100)) - 50;
    const th = bandH * 0.8;
    const ty = bandY + bandH - th;
    // Trunk
    ctx.fillStyle = "#6b3a1f";
    ctx.fillRect(tx - 8, ty + th * 0.5, 16, th * 0.5);
    // Leaves
    ctx.fillStyle = "#2a6a18";
    ctx.beginPath();
    ctx.arc(tx, ty + th * 0.35, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a8a28";
    ctx.beginPath();
    ctx.arc(tx - 14, ty + th * 0.5, 18, 0, Math.PI * 2);
    ctx.arc(tx + 14, ty + th * 0.5, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cages / fences
  ctx.strokeStyle = "#d4c070";
  ctx.lineWidth = 2;
  const fenceX = ((W * 0.7 - offset * 0.3) % (W + 200)) - 100;
  for (let f = 0; f < 8; f++) {
    const fx = fenceX + f * 18;
    ctx.beginPath();
    ctx.moveTo(fx, bandY + 10);
    ctx.lineTo(fx, bandY + bandH - 10);
    ctx.stroke();
  }
  ctx.strokeStyle = "#d4c070";
  ctx.beginPath();
  ctx.moveTo(fenceX, bandY + 10);
  ctx.lineTo(fenceX + 126, bandY + 10);
  ctx.moveTo(fenceX, bandY + bandH - 10);
  ctx.lineTo(fenceX + 126, bandY + bandH - 10);
  ctx.stroke();
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
  w: number,
  h: number,
  _laneW: number,
) {
  const hw = w / 2;
  const hh = h / 2;
  ctx.save();
  switch (type) {
    case "BARRIER": {
      // Striped red/white barrier
      ctx.fillStyle = "#cc2222";
      ctx.fillRect(x - hw, y - hh, w, h);
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 5; i++) {
        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(x - hw + i * (w / 5), y - hh);
          ctx.lineTo(x - hw + (i + 1) * (w / 5), y - hh);
          ctx.lineTo(x - hw + i * (w / 5), y + hh);
          ctx.closePath();
          ctx.fill();
        }
      }
      // Post
      ctx.fillStyle = "#888";
      ctx.fillRect(x - 4, y - hh - 20, 8, 20);
      // Outline
      ctx.strokeStyle = "#880000";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - hw, y - hh, w, h);
      break;
    }
    case "BLOCK": {
      // Stone crate
      const blockGrad = ctx.createLinearGradient(
        x - hw,
        y - hh,
        x + hw,
        y + hh,
      );
      blockGrad.addColorStop(0, "#b0917a");
      blockGrad.addColorStop(1, "#7a5a44");
      ctx.fillStyle = blockGrad;
      ctx.beginPath();
      ctx.roundRect(x - hw, y - hh, w, h, 4);
      ctx.fill();
      // Stone lines
      ctx.strokeStyle = "#5a3a2a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - hh);
      ctx.lineTo(x, y + hh);
      ctx.moveTo(x - hw, y);
      ctx.lineTo(x + hw, y);
      ctx.stroke();
      // Outline
      ctx.strokeStyle = "#4a2a1a";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x - hw, y - hh, w, h);
      break;
    }
    case "GAP": {
      // Dark pit
      const gapGrad = ctx.createLinearGradient(0, y - hh, 0, y + hh);
      gapGrad.addColorStop(0, "#1a1a2a");
      gapGrad.addColorStop(1, "#000010");
      ctx.fillStyle = gapGrad;
      ctx.fillRect(x - hw, y - hh, w, h);
      // Jagged edges
      ctx.fillStyle = "#888898";
      const jagged = 6;
      ctx.beginPath();
      ctx.moveTo(x - hw, y - hh);
      for (let i = 0; i <= jagged; i++) {
        const jx = x - hw + (i * w) / jagged;
        const jy = i % 2 === 0 ? y - hh : y - hh + 8;
        ctx.lineTo(jx, jy);
      }
      ctx.lineTo(x + hw, y - hh);
      ctx.closePath();
      ctx.fill();
      // Glowing pit effect
      const pitGlow = ctx.createRadialGradient(x, y, 0, x, y, hw);
      pitGlow.addColorStop(0, "rgba(50,0,100,0.4)");
      pitGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pitGlow;
      ctx.fillRect(x - hw, y - hh, w, h);
      break;
    }
    case "MOVING": {
      // Diamond shape
      ctx.fillStyle = "#ff8800";
      ctx.beginPath();
      ctx.moveTo(x, y - hh);
      ctx.lineTo(x + hw, y);
      ctx.lineTo(x, y + hh);
      ctx.lineTo(x - hw, y);
      ctx.closePath();
      ctx.fill();
      // Inner diamond
      ctx.fillStyle = "#ffcc00";
      ctx.beginPath();
      ctx.moveTo(x, y - hh * 0.5);
      ctx.lineTo(x + hw * 0.5, y);
      ctx.lineTo(x, y + hh * 0.5);
      ctx.lineTo(x - hw * 0.5, y);
      ctx.closePath();
      ctx.fill();
      // Outline
      ctx.strokeStyle = "#cc4400";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - hh);
      ctx.lineTo(x + hw, y);
      ctx.lineTo(x, y + hh);
      ctx.lineTo(x - hw, y);
      ctx.closePath();
      ctx.stroke();
      // Exclamation
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("!", x, y + 5);
      break;
    }
  }
  ctx.restore();
}

function drawCoin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
) {
  const pulse = Math.sin(frame * 0.15) * 2;
  const r = 10 + pulse;
  ctx.save();
  // Outer glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r + 6);
  glow.addColorStop(0, "rgba(255,220,0,0.4)");
  glow.addColorStop(1, "rgba(255,220,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r + 6, 0, Math.PI * 2);
  ctx.fill();
  // Coin body
  const coinGrad = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, r);
  coinGrad.addColorStop(0, "#ffe066");
  coinGrad.addColorStop(0.7, "#ffc400");
  coinGrad.addColorStop(1, "#c87800");
  ctx.fillStyle = coinGrad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // Star inside
  ctx.fillStyle = "#c87800";
  ctx.font = `bold ${Math.floor(r * 1.2)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("★", x, y);
  ctx.restore();
}

function drawEnergyPickup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
) {
  const pulse = Math.sin(frame * 0.12) * 3;
  ctx.save();
  // Glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 20 + pulse);
  glow.addColorStop(0, "rgba(50,180,255,0.5)");
  glow.addColorStop(1, "rgba(50,180,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 20 + pulse, 0, Math.PI * 2);
  ctx.fill();
  // Lightning bolt
  ctx.fillStyle = "#40c8ff";
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 18);
  ctx.lineTo(x - 2, y - 2);
  ctx.lineTo(x + 4, y - 2);
  ctx.lineTo(x - 6, y + 18);
  ctx.lineTo(x + 2, y + 2);
  ctx.lineTo(x - 4, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#80e8ff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawFallbackBoy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pose: number,
  isHit: boolean,
) {
  ctx.save();
  if (isHit) ctx.globalAlpha = 0.7;
  const bodyColor = isHit ? "#ff4444" : "#ff7722";
  // Body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x - w * 0.3, y - h * 0.6, w * 0.6, h * 0.4);
  // Head
  ctx.fillStyle = "#ffcc88";
  ctx.beginPath();
  ctx.arc(x, y - h * 0.75, w * 0.28, 0, Math.PI * 2);
  ctx.fill();
  // Eye
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(x + 4, y - h * 0.78, 2, 0, Math.PI * 2);
  ctx.fill();
  // Legs (animated based on pose)
  ctx.fillStyle = "#2244aa";
  if (pose === 2) {
    // Slide
    ctx.fillRect(x - w * 0.5, y - h * 0.25, w, h * 0.15);
  } else {
    const legSwing = pose === 1 ? 0 : ((y * 0.1) % 10) - 5;
    ctx.fillRect(x - w * 0.3, y - h * 0.2, w * 0.25, h * 0.35 + legSwing);
    ctx.fillRect(x + w * 0.05, y - h * 0.2, w * 0.25, h * 0.35 - legSwing);
  }
  ctx.restore();
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  W: number,
  score: number,
  coins: number,
  energy: number,
) {
  // HUD background
  ctx.save();
  ctx.fillStyle = "rgba(0,0,15,0.65)";
  ctx.beginPath();
  ctx.roundRect(8, 8, W - 16, 44, 10);
  ctx.fill();

  // Coin icon + count
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.arc(28, 30, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#aa7700";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("★", 28, 30);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px Outfit, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`${coins}`, 44, 30);

  // Score
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `SCORE: ${Math.floor(score).toString().padStart(6, "0")}`,
    W / 2,
    30,
  );

  // Energy bar
  const barX = W - 100;
  const barY = 20;
  const barW = 80;
  const barH = 14;
  const barRadius = 6;
  // Background
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, barRadius);
  ctx.fill();
  // Fill
  const energyRatio = energy / 100;
  const fillW = barW * energyRatio;
  const energyGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  if (energyRatio > 0.5) {
    energyGrad.addColorStop(0, "#22cc44");
    energyGrad.addColorStop(1, "#88ff44");
  } else if (energyRatio > 0.25) {
    energyGrad.addColorStop(0, "#cc8800");
    energyGrad.addColorStop(1, "#ffcc00");
  } else {
    energyGrad.addColorStop(0, "#cc2200");
    energyGrad.addColorStop(1, "#ff4400");
  }
  if (fillW > barRadius * 2) {
    ctx.fillStyle = energyGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, barH, barRadius);
    ctx.fill();
  }
  // Border
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, barRadius);
  ctx.stroke();
  // Lightning icon
  ctx.fillStyle = "#40c8ff";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("⚡", barX - 2, barY + barH / 2);

  ctx.restore();
}
