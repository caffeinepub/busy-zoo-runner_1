import { useCallback, useEffect, useRef, useState } from "react";
import { useGameEngine } from "../hooks/useGameEngine";
import GameScene3D from "./game3d/GameScene3D";
import HUD3D from "./game3d/HUD3D";

interface GameScreenProps {
  onGameOver: (score: number, coins: number) => void;
}

export default function GameScreen({ onGameOver }: GameScreenProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { stateRef, reset, actions, tick } = useGameEngine();
  const [hudState, setHudState] = useState({
    score: 0,
    coins: 0,
    energy: 100,
  });

  // Sync HUD state from stateRef each animation frame
  useEffect(() => {
    let rafId: number;
    const syncHUD = () => {
      const s = stateRef.current;
      setHudState({
        score: Math.floor(s.score),
        coins: s.coins,
        energy: s.energy,
      });
      rafId = requestAnimationFrame(syncHUD);
    };
    rafId = requestAnimationFrame(syncHUD);
    return () => cancelAnimationFrame(rafId);
  }, [stateRef]);

  // Reset on mount
  useEffect(() => {
    reset();
  }, [reset]);

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
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [actions]);

  // Touch swipe controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!touchStartRef.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx < -40) actions.moveLeft();
        else if (dx > 40) actions.moveRight();
      } else {
        if (dy < -40) actions.jump();
        else if (dy > 40) actions.slide();
      }
      touchStartRef.current = null;
    },
    [actions],
  );

  const wrappedOnGameOver = useCallback(
    (score: number, coins: number) => {
      onGameOver(score, coins);
    },
    [onGameOver],
  );

  return (
    <div
      data-ocid="game.canvas_target"
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        touchAction: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Scene fills full screen */}
      <GameScene3D
        onGameOver={wrappedOnGameOver}
        stateRef={stateRef}
        tick={tick}
      />

      {/* DOM-based HUD overlay */}
      <HUD3D
        score={hudState.score}
        coins={hudState.coins}
        energy={hudState.energy}
      />

      {/* On-screen control buttons */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: "0 18px",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        {/* Left / Right lane change */}
        <div style={{ display: "flex", gap: 10, pointerEvents: "all" }}>
          <ControlBtn
            onClick={() => actions.moveLeft()}
            label="←"
            data-ocid="game.secondary_button"
          />
          <ControlBtn
            onClick={() => actions.moveRight()}
            label="→"
            data-ocid="game.secondary_button"
          />
        </div>

        {/* Slide / Jump */}
        <div style={{ display: "flex", gap: 10, pointerEvents: "all" }}>
          <ControlBtn
            onClick={() => actions.slide()}
            label="↓"
            color="#f59e0b"
            data-ocid="game.secondary_button"
          />
          <ControlBtn
            onClick={() => actions.jump()}
            label="↑"
            color="#22c55e"
            data-ocid="game.primary_button"
          />
        </div>
      </div>
    </div>
  );
}

// ── On-screen control button ───────────────────────────────────────────────────

interface ControlBtnProps {
  onClick: () => void;
  label: string;
  color?: string;
  "data-ocid"?: string;
}

function ControlBtn({
  onClick,
  label,
  color = "#6366f1",
  "data-ocid": ocid,
}: ControlBtnProps) {
  return (
    <button
      type="button"
      data-ocid={ocid}
      onPointerDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      style={{
        width: 62,
        height: 62,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.28)",
        background: `${color}bb`,
        color: "#fff",
        fontSize: 22,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
        boxShadow: `0 4px 16px ${color}55`,
      }}
    >
      {label}
    </button>
  );
}
