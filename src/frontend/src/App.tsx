import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import GameOverScreen from "./components/GameOverScreen";
import GameScreen from "./components/GameScreen";
import ShopScreen from "./components/ShopScreen";
import StartScreen from "./components/StartScreen";
import { useActor } from "./hooks/useActor";

type Screen = "start" | "game" | "gameover" | "shop";

interface GameResult {
  score: number;
  coins: number;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [gameResult, setGameResult] = useState<GameResult>({
    score: 0,
    coins: 0,
  });
  const [bestScore, setBestScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const { actor, isFetching } = useActor();
  const submittingRef = useRef(false);

  // Fetch best score on mount
  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getOrCreateProfile()
      .then((p) => setBestScore(Number(p.bestScore)))
      .catch(console.error);
  }, [actor, isFetching]);

  const handleGameOver = useCallback(
    async (score: number, coins: number) => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      setGameResult({ score, coins });

      const newHigh = score > bestScore;
      setIsNewHighScore(newHigh);
      if (newHigh) setBestScore(score);

      setScreen("gameover");

      // Submit to backend
      if (actor) {
        try {
          await Promise.all([
            actor.submitScore(BigInt(score)),
            coins > 0 ? actor.addCoins(BigInt(coins)) : Promise.resolve(),
          ]);
        } catch (e) {
          console.error("Failed to submit score:", e);
        }
      }

      submittingRef.current = false;
    },
    [actor, bestScore],
  );

  const handlePlay = useCallback(() => {
    setScreen("game");
  }, []);

  const handlePlayAgain = useCallback(() => {
    setScreen("game");
  }, []);

  const handleMainMenu = useCallback(() => {
    setScreen("start");
  }, []);

  const handleShop = useCallback(() => {
    setScreen("shop");
  }, []);

  const handleBackFromShop = useCallback(() => {
    setScreen("start");
  }, []);

  return (
    <AnimatePresence mode="wait">
      {screen === "start" && (
        <StartScreen key="start" onPlay={handlePlay} onShop={handleShop} />
      )}

      {screen === "game" && (
        <GameScreen key="game" onGameOver={handleGameOver} />
      )}

      {screen === "gameover" && (
        <GameOverScreen
          key="gameover"
          score={gameResult.score}
          coins={gameResult.coins}
          bestScore={bestScore}
          isNewHighScore={isNewHighScore}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleMainMenu}
        />
      )}

      {screen === "shop" && (
        <ShopScreen key="shop" onBack={handleBackFromShop} />
      )}
    </AnimatePresence>
  );
}
