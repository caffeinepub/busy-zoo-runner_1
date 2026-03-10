interface HUD3DProps {
  score: number;
  coins: number;
  energy: number;
}

export default function HUD3D({ score, coins, energy }: HUD3DProps) {
  const energyColor =
    energy > 50 ? "#22cc44" : energy > 25 ? "#ff9900" : "#cc2200";

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0,0,15,0.7)",
          borderRadius: 14,
          padding: "9px 16px",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          gap: 12,
        }}
      >
        {/* Coins */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>🪙</span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#ffd700",
              fontFamily: '"Bricolage Grotesque", "Outfit", sans-serif',
              minWidth: 28,
            }}
          >
            {coins}
          </span>
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: '"Bricolage Grotesque", "Outfit", sans-serif',
            letterSpacing: "1.5px",
          }}
        >
          {Math.floor(score).toString().padStart(6, "0")}
        </div>

        {/* Energy bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>⚡</span>
          <div
            style={{
              width: 72,
              height: 13,
              background: "rgba(0,0,0,0.55)",
              borderRadius: 7,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.max(0, energy)}%`,
                background: energyColor,
                borderRadius: 7,
                transition: "width 0.1s linear, background-color 0.3s ease",
                boxShadow:
                  energy > 25
                    ? `0 0 6px ${energyColor}88`
                    : "0 0 8px #cc220099",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
