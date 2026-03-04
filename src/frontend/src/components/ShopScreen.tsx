import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Item, PlayerProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface ShopScreenProps {
  onBack: () => void;
}

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  outfit: "👕",
  powerup: "⚡",
  boost: "🚀",
  cosmetic: "✨",
  default: "🎁",
};

// Item icons by name keyword
function getItemIcon(item: Item): string {
  const n = item.name.toLowerCase();
  if (n.includes("outfit") || n.includes("suit") || n.includes("costume"))
    return "👕";
  if (n.includes("lightning") || n.includes("energy")) return "⚡";
  if (n.includes("shield") || n.includes("armor")) return "🛡️";
  if (n.includes("magnet") || n.includes("coin")) return "🧲";
  if (n.includes("speed") || n.includes("boost")) return "🚀";
  if (n.includes("double") || n.includes("2x")) return "✖️2";
  if (n.includes("wings") || n.includes("fly")) return "🦅";
  if (n.includes("hat")) return "🎩";
  if (n.includes("shoes") || n.includes("boots")) return "👟";
  return CATEGORY_ICONS[item.category] ?? CATEGORY_ICONS.default;
}

export default function ShopScreen({ onBack }: ShopScreenProps) {
  const { actor, isFetching } = useActor();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    Promise.all([actor.getOrCreateProfile(), actor.getShopCatalog()])
      .then(([p, catalog]) => {
        setProfile(p);
        setItems(catalog);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [actor, isFetching]);

  const handleBuy = async (item: Item) => {
    if (!actor || buyingId) return;
    setBuyingId(item.id);
    setError(null);
    try {
      await actor.purchaseItem(item.id);
      const updated = await actor.getPlayerProfile();
      setProfile(updated);
      setFeedbackId(item.id);
      setTimeout(() => setFeedbackId(null), 1500);
    } catch (e) {
      console.error(e);
      setError("Purchase failed. Try again.");
    } finally {
      setBuyingId(null);
    }
  };

  const isOwned = (itemId: string) =>
    profile?.purchasedItems.includes(itemId) ?? false;
  const canAfford = (price: bigint) =>
    profile ? profile.coinBalance >= price : false;

  return (
    <div
      className="game-wrapper"
      style={{
        flexDirection: "column",
        background:
          "linear-gradient(180deg, #0a1a3d 0%, #0d2460 50%, #0a1a3d 100%)",
        overflow: "hidden",
      }}
    >
      {/* Scrollable container */}
      <div
        style={{
          width: "min(400px, 100vw)",
          height: "100dvh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "rgba(10,26,61,0.92)",
            backdropFilter: "blur(8px)",
            padding: "16px 16px 12px",
            borderBottom: "1px solid rgba(255,200,50,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <motion.button
              data-ocid="shop.back_button"
              onClick={onBack}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ←
            </motion.button>

            <div style={{ flex: 1 }}>
              <h2
                className="font-display"
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: "#ff8800",
                  margin: 0,
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                🛍 ZOO SHOP
              </h2>
            </div>

            {/* Coin balance */}
            {profile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255,215,0,0.12)",
                  border: "1px solid rgba(255,215,0,0.3)",
                  borderRadius: 20,
                  padding: "4px 12px",
                }}
              >
                <span style={{ fontSize: 16 }}>🪙</span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#ffd700",
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                  }}
                >
                  {Number(profile.coinBalance).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <div style={{ flex: 1, padding: "16px 12px 24px" }}>
          {loading ? (
            <div
              data-ocid="shop.loading_state"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: 300,
                gap: 16,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                style={{ fontSize: 40 }}
              >
                🌀
              </motion.div>
              <p style={{ color: "rgba(180,200,255,0.6)", fontSize: 14 }}>
                Loading shop...
              </p>
            </div>
          ) : items.length === 0 ? (
            <div
              data-ocid="shop.empty_state"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: 300,
                gap: 12,
              }}
            >
              <span style={{ fontSize: 48 }}>🏪</span>
              <p
                style={{
                  color: "rgba(180,200,255,0.6)",
                  fontSize: 15,
                  textAlign: "center",
                }}
              >
                No items available yet.
                <br />
                Check back soon!
              </p>
            </div>
          ) : (
            <>
              {error && (
                <motion.div
                  data-ocid="shop.error_state"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: "rgba(200,50,50,0.2)",
                    border: "1px solid rgba(200,50,50,0.4)",
                    borderRadius: 12,
                    padding: "10px 16px",
                    marginBottom: 12,
                    color: "#ff8888",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  {error}
                </motion.div>
              )}

              {/* Item grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <AnimatePresence>
                  {items.map((item, idx) => {
                    const owned = isOwned(item.id);
                    const affordable = canAfford(item.price);
                    const isBuying = buyingId === item.id;
                    const justBought = feedbackId === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        data-ocid={`shop.item.${idx + 1}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        style={{
                          background: owned
                            ? "rgba(50,200,100,0.08)"
                            : "rgba(255,255,255,0.05)",
                          border: `1.5px solid ${
                            owned
                              ? "rgba(50,200,100,0.3)"
                              : justBought
                                ? "rgba(255,215,0,0.5)"
                                : "rgba(255,255,255,0.1)"
                          }`,
                          borderRadius: 16,
                          padding: "14px 12px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {/* Item icon */}
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            background: owned
                              ? "rgba(50,200,100,0.15)"
                              : "rgba(255,150,0,0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 28,
                            border: `2px solid ${owned ? "rgba(50,200,100,0.4)" : "rgba(255,150,0,0.3)"}`,
                          }}
                        >
                          {getItemIcon(item)}
                        </div>

                        {/* Name */}
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#fff",
                            textAlign: "center",
                            lineHeight: 1.2,
                            fontFamily: '"Bricolage Grotesque", sans-serif',
                          }}
                        >
                          {item.name}
                        </div>

                        {/* Description */}
                        <div
                          style={{
                            fontSize: 11,
                            color: "rgba(180,200,255,0.6)",
                            textAlign: "center",
                            lineHeight: 1.4,
                          }}
                        >
                          {item.description}
                        </div>

                        {/* Price */}
                        {!owned && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 14,
                              fontWeight: 800,
                              color: affordable
                                ? "#ffd700"
                                : "rgba(200,180,100,0.5)",
                              fontFamily: '"Bricolage Grotesque", sans-serif',
                            }}
                          >
                            🪙 {Number(item.price).toLocaleString()}
                          </div>
                        )}

                        {/* Buy / Owned button */}
                        {owned ? (
                          <div
                            style={{
                              background: "rgba(50,200,100,0.2)",
                              border: "1px solid rgba(50,200,100,0.4)",
                              borderRadius: 20,
                              padding: "6px 16px",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#50cc88",
                              letterSpacing: "0.5px",
                            }}
                          >
                            ✓ OWNED
                          </div>
                        ) : (
                          <motion.button
                            data-ocid={`shop.buy_button.${idx + 1}`}
                            onClick={() => handleBuy(item)}
                            disabled={!affordable || !!buyingId}
                            whileHover={
                              affordable && !buyingId ? { scale: 1.04 } : {}
                            }
                            whileTap={
                              affordable && !buyingId ? { scale: 0.96 } : {}
                            }
                            style={{
                              padding: "7px 20px",
                              borderRadius: 20,
                              border: "none",
                              background:
                                !affordable || !!buyingId
                                  ? "rgba(100,100,100,0.3)"
                                  : "linear-gradient(135deg, #ff8800, #ff5500)",
                              color: !affordable
                                ? "rgba(180,180,180,0.5)"
                                : "#fff",
                              fontSize: 13,
                              fontWeight: 800,
                              fontFamily: '"Bricolage Grotesque", sans-serif',
                              cursor:
                                affordable && !buyingId
                                  ? "pointer"
                                  : "not-allowed",
                              boxShadow:
                                affordable && !buyingId
                                  ? "0 4px 12px rgba(255,100,0,0.3)"
                                  : "none",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {isBuying ? "..." : "BUY"}
                          </motion.button>
                        )}

                        {/* Just bought flash */}
                        <AnimatePresence>
                          {justBought && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(255,215,0,0.15)",
                                borderRadius: 16,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 36,
                              }}
                            >
                              ✨
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "8px 16px 16px", textAlign: "center" }}>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: "rgba(130,160,200,0.4)",
              textDecoration: "none",
            }}
          >
            © {new Date().getFullYear()}. Built with ❤️ using caffeine.ai
          </a>
        </div>
      </div>
    </div>
  );
}
