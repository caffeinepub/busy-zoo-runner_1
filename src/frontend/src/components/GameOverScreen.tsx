import { AnimatePresence, motion } from "motion/react";

interface GameOverScreenProps {
  score: number;
  coins: number;
  bestScore: number;
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export default function GameOverScreen({
  score,
  coins,
  bestScore,
  isNewHighScore,
  onPlayAgain,
  onMainMenu,
}: GameOverScreenProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,20,0.85)",
          zIndex: 100,
          backdropFilter: "blur(6px)",
        }}
      >
        <motion.div
          initial={{ scale: 0.7, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 16, stiffness: 220 }}
          style={{
            width: "min(360px, 90vw)",
            background: "linear-gradient(160deg, #1a2a5a 0%, #0d1a3a 100%)",
            borderRadius: 24,
            border: "2px solid rgba(255,100,0,0.4)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(255,100,0,0.2)",
            overflow: "hidden",
          }}
        >
          {/* Top stripe */}
          <div
            style={{
              height: 6,
              background: "linear-gradient(90deg, #ff2200, #ff6600, #ff2200)",
            }}
          />

          <div style={{ padding: "28px 28px 24px" }}>
            {/* GAME OVER title */}
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              style={{
                textAlign: "center",
                fontSize: 44,
                fontWeight: 900,
                fontFamily: '"Bricolage Grotesque", sans-serif',
                color: "#ff3300",
                WebkitTextStroke: "2px rgba(0,0,0,0.5)",
                paintOrder: "stroke fill",
                textShadow: "0 4px 16px rgba(255,50,0,0.5)",
                margin: 0,
                letterSpacing: "-1px",
              }}
            >
              GAME OVER
            </motion.h2>

            {/* New high score banner */}
            {isNewHighScore && (
              <motion.div
                initial={{ scale: 0, rotate: -6 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.3, damping: 10 }}
                style={{
                  background: "linear-gradient(135deg, #ffd700, #ff9900)",
                  borderRadius: 12,
                  padding: "8px 16px",
                  textAlign: "center",
                  marginTop: 12,
                  boxShadow: "0 4px 16px rgba(255,180,0,0.5)",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    color: "#3a1a00",
                    letterSpacing: "1px",
                  }}
                >
                  🏆 NEW HIGH SCORE! 🏆
                </span>
              </motion.div>
            )}

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                marginTop: 20,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <ScoreRow
                icon="⭐"
                label="SCORE"
                value={score.toLocaleString()}
                highlight
              />
              <ScoreRow
                icon="🪙"
                label="COINS"
                value={coins.toLocaleString()}
              />
              <ScoreRow
                icon="🏆"
                label="BEST"
                value={Math.max(score, bestScore).toLocaleString()}
              />
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 24,
                alignItems: "center",
              }}
            >
              <motion.button
                data-ocid="gameover.play_again_button"
                onClick={onPlayAgain}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: "100%",
                  maxWidth: 240,
                  height: 56,
                  borderRadius: 28,
                  background: "linear-gradient(135deg, #ff8800, #ff4400)",
                  border: "none",
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 900,
                  fontFamily: '"Bricolage Grotesque", sans-serif',
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(255,100,0,0.45)",
                  letterSpacing: "1px",
                }}
              >
                ▶ PLAY AGAIN
              </motion.button>

              <motion.button
                data-ocid="gameover.menu_button"
                onClick={onMainMenu}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: "100%",
                  maxWidth: 180,
                  height: 44,
                  borderRadius: 22,
                  background: "transparent",
                  border: "2px solid rgba(180,200,255,0.3)",
                  color: "rgba(180,200,255,0.8)",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: '"Bricolage Grotesque", sans-serif',
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                }}
              >
                ← MAIN MENU
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ScoreRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderRadius: 12,
        background: highlight
          ? "rgba(255,150,0,0.12)"
          : "rgba(255,255,255,0.05)",
        border: `1px solid ${highlight ? "rgba(255,150,0,0.25)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "rgba(180,200,255,0.7)",
            letterSpacing: "1px",
          }}
        >
          {label}
        </span>
      </span>
      <span
        style={{
          fontSize: highlight ? 22 : 18,
          fontWeight: 900,
          fontFamily: '"Bricolage Grotesque", sans-serif',
          color: highlight ? "#ff9922" : "#ffffff",
        }}
      >
        {value}
      </span>
    </div>
  );
}
