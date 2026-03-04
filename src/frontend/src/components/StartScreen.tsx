import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { PlayerProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface StartScreenProps {
  onPlay: () => void;
  onShop: () => void;
}

export default function StartScreen({ onPlay, onShop }: StartScreenProps) {
  const { actor, isFetching } = useActor();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getOrCreateProfile()
      .then((p) => setProfile(p))
      .catch(console.error);
  }, [actor, isFetching]);

  return (
    <div
      className="game-wrapper"
      style={{
        flexDirection: "column",
        background:
          "linear-gradient(180deg, #0a1a3d 0%, #1a3a7a 40%, #2a5fa8 100%)",
      }}
    >
      {/* Floating decorative animals */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {["🦁", "🐘", "🦒", "🐵", "🐆", "🦜"].map((emoji, i) => (
          <motion.div
            key={emoji}
            style={{
              position: "absolute",
              fontSize: 32,
              left: `${10 + i * 15}%`,
              top: `${15 + (i % 3) * 20}%`,
              opacity: 0.18,
            }}
            animate={{
              y: [0, -12, 0],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 2.5 + i * 0.4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          width: "min(400px, 100vw)",
          maxHeight: "100dvh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Title art */}
        <div
          style={{
            width: "100%",
            height: 220,
            position: "relative",
            overflow: "hidden",
            borderRadius: "0 0 24px 24px",
          }}
        >
          <img
            src="/assets/generated/title-screen-art.dim_800x400.jpg"
            alt="Busy Zoo title art"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(10,26,61,0.95) 100%)",
            }}
          />
        </div>

        {/* Game title */}
        <motion.div
          style={{
            textAlign: "center",
            marginTop: -32,
            position: "relative",
            zIndex: 2,
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1
            className="font-display"
            style={{
              fontSize: 52,
              fontWeight: 900,
              lineHeight: 1,
              color: "#ff8800",
              WebkitTextStroke: "3px #000",
              paintOrder: "stroke fill",
              textShadow: "0 4px 20px rgba(255,140,0,0.6)",
              letterSpacing: "-1px",
            }}
          >
            BUSY ZOO
          </h1>

          <motion.p
            style={{
              fontSize: 15,
              color: "#7ed4f8",
              marginTop: 4,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            How far can you run? 🏃
          </motion.p>
        </motion.div>

        {/* Stats row */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              display: "flex",
              gap: 16,
              marginTop: 20,
              padding: "10px 24px",
              background: "rgba(255,255,255,0.07)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
            }}
          >
            <StatPill
              icon="🏆"
              label="Best"
              value={Number(profile.bestScore).toLocaleString()}
            />
            <div
              style={{
                width: 1,
                background: "rgba(255,255,255,0.15)",
                alignSelf: "stretch",
              }}
            />
            <StatPill
              icon="🪙"
              label="Coins"
              value={Number(profile.coinBalance).toLocaleString()}
            />
          </motion.div>
        )}

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
            padding: "20px 32px",
            alignItems: "center",
          }}
        >
          {/* PLAY button */}
          <motion.button
            data-ocid="start.play_button"
            onClick={onPlay}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="animate-pulse-scale"
            style={{
              width: "100%",
              maxWidth: 280,
              height: 64,
              borderRadius: 32,
              background: "linear-gradient(135deg, #ff8800 0%, #ff5500 100%)",
              border: "none",
              color: "#fff",
              fontSize: 26,
              fontWeight: 900,
              fontFamily: '"Bricolage Grotesque", sans-serif',
              cursor: "pointer",
              boxShadow:
                "0 6px 24px rgba(255,100,0,0.5), 0 0 0 3px rgba(255,150,0,0.3)",
              letterSpacing: "2px",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            ▶ PLAY
          </motion.button>

          {/* SHOP button */}
          <motion.button
            data-ocid="start.shop_button"
            onClick={onShop}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: "100%",
              maxWidth: 200,
              height: 48,
              borderRadius: 24,
              background: "rgba(255,255,255,0.1)",
              border: "2px solid rgba(255,200,50,0.6)",
              color: "#ffe066",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: '"Bricolage Grotesque", sans-serif',
              cursor: "pointer",
              letterSpacing: "1px",
              backdropFilter: "blur(4px)",
            }}
          >
            🛍 SHOP
          </motion.button>
        </motion.div>

        {/* Controls hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            padding: "12px 24px 24px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "rgba(180,210,255,0.6)",
              fontWeight: 500,
              lineHeight: 1.6,
            }}
          >
            Swipe ↑↓ to jump/slide • Swipe ←→ to change lane
            <br />
            Keyboard: WASD / Arrow keys
          </p>
        </motion.div>

        {/* Footer */}
        <div
          style={{
            padding: "8px 24px 16px",
            textAlign: "center",
          }}
        >
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: "rgba(130,160,200,0.5)",
              textDecoration: "none",
            }}
          >
            © {new Date().getFullYear()}. Built with ❤️ using caffeine.ai
          </a>
        </div>
      </motion.div>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div
        style={{
          fontSize: 11,
          color: "rgba(180,210,255,0.6)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
        {value}
      </div>
    </div>
  );
}
