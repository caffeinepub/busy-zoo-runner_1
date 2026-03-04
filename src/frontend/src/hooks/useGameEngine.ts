import { useCallback, useRef } from "react";

export type ObstacleType = "BARRIER" | "BLOCK" | "GAP" | "MOVING";

export interface Obstacle {
  id: number;
  type: ObstacleType;
  lane: number;
  y: number;
  width: number;
  height: number;
  // For MOVING obstacles
  moveDir: number;
  moveTimer: number;
}

export interface Coin {
  id: number;
  lane: number;
  y: number;
  collected: boolean;
}

export interface EnergyPickup {
  id: number;
  lane: number;
  y: number;
}

export interface Animal {
  type: "elephant" | "giraffe" | "monkey" | "lion";
  x: number;
  y: number;
  speed: number;
  frame: number;
}

export interface GameState {
  isAlive: boolean;
  score: number;
  coins: number;
  energy: number;
  lane: number;
  playerY: number;
  isJumping: boolean;
  jumpFrame: number;
  isSliding: boolean;
  slideFrame: number;
  hitFrame: number;
  invincibleFrame: number;
  gameSpeed: number;
  frame: number;
  obstacles: Obstacle[];
  coinItems: Coin[];
  energyPickups: EnergyPickup[];
  bgOffset: number;
  cloudOffset: number;
  animals: Animal[];
  nextObstacleIn: number;
  nextCoinIn: number;
  nextEnergyIn: number;
  nextId: number;
}

export function createInitialState(): GameState {
  return {
    isAlive: true,
    score: 0,
    coins: 0,
    energy: 100,
    lane: 1,
    playerY: 0,
    isJumping: false,
    jumpFrame: 0,
    isSliding: false,
    slideFrame: 0,
    hitFrame: 0,
    invincibleFrame: 0,
    gameSpeed: 4,
    frame: 0,
    obstacles: [],
    coinItems: [],
    energyPickups: [],
    bgOffset: 0,
    cloudOffset: 0,
    animals: createAnimals(),
    nextObstacleIn: 80,
    nextCoinIn: 60,
    nextEnergyIn: 200,
    nextId: 0,
  };
}

function createAnimals(): Animal[] {
  return [
    { type: "elephant", x: 420, y: 0, speed: 0.4, frame: 0 },
    { type: "giraffe", x: 650, y: 0, speed: 0.3, frame: 0 },
    { type: "monkey", x: 200, y: 0, speed: 0.6, frame: 0 },
    { type: "lion", x: 900, y: 0, speed: 0.35, frame: 0 },
  ];
}

export interface GameActions {
  jump: () => void;
  slide: () => void;
  moveLeft: () => void;
  moveRight: () => void;
}

export function useGameEngine() {
  const stateRef = useRef<GameState>(createInitialState());

  const reset = useCallback(() => {
    stateRef.current = createInitialState();
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  const actions: GameActions = {
    jump: () => {
      const s = stateRef.current;
      if (!s.isAlive) return;
      if (!s.isJumping) {
        s.isJumping = true;
        s.jumpFrame = 0;
        s.isSliding = false;
        s.slideFrame = 0;
      }
    },
    slide: () => {
      const s = stateRef.current;
      if (!s.isAlive) return;
      if (!s.isSliding && !s.isJumping) {
        s.isSliding = true;
        s.slideFrame = 0;
      }
    },
    moveLeft: () => {
      const s = stateRef.current;
      if (!s.isAlive) return;
      if (s.lane > 0) s.lane--;
    },
    moveRight: () => {
      const s = stateRef.current;
      if (!s.isAlive) return;
      if (s.lane < 2) s.lane++;
    },
  };

  const tick = useCallback(
    (
      canvasWidth: number,
      canvasHeight: number,
      onGameOver: (score: number, coins: number) => void,
    ) => {
      const s = stateRef.current;
      if (!s.isAlive) return;

      // --- Speed & Score ---
      s.gameSpeed += 0.001;
      s.score += s.gameSpeed;
      s.frame++;

      // --- Energy depletion ---
      s.energy = Math.max(0, s.energy - 0.05);
      if (s.energy <= 0) {
        s.isAlive = false;
        onGameOver(Math.floor(s.score), s.coins);
        return;
      }

      // --- Jump arc ---
      const JUMP_DURATION = 40;
      if (s.isJumping) {
        s.jumpFrame++;
        const progress = s.jumpFrame / JUMP_DURATION;
        const arc = -Math.sin(progress * Math.PI);
        s.playerY = arc * 100;
        if (s.jumpFrame >= JUMP_DURATION) {
          s.isJumping = false;
          s.jumpFrame = 0;
          s.playerY = 0;
        }
      }

      // --- Slide ---
      const SLIDE_DURATION = 30;
      if (s.isSliding) {
        s.slideFrame++;
        if (s.slideFrame >= SLIDE_DURATION) {
          s.isSliding = false;
          s.slideFrame = 0;
        }
      }

      // --- Hit flash ---
      if (s.hitFrame > 0) s.hitFrame--;
      if (s.invincibleFrame > 0) s.invincibleFrame--;

      // --- Background ---
      s.bgOffset = (s.bgOffset + s.gameSpeed * 0.3) % 1200;
      s.cloudOffset = (s.cloudOffset + s.gameSpeed * 0.1) % canvasWidth;

      // --- Animals ---
      for (const animal of s.animals) {
        animal.x -= animal.speed;
        animal.frame = (animal.frame + 0.08) % 4;
        if (animal.x < -200) animal.x = canvasWidth + 100 + Math.random() * 400;
      }

      // --- Road section ---
      const roadTop = canvasHeight * 0.45;
      const laneWidth = canvasWidth / 3;

      // Lane X centers
      const laneXCenters = [laneWidth * 0.5, laneWidth * 1.5, laneWidth * 2.5];

      // Player position
      const playerX = laneXCenters[s.lane];
      const playerBaseY = canvasHeight * 0.65;
      const playerDrawY = playerBaseY + s.playerY;
      const playerW = s.isSliding ? 60 : 50;
      const playerH = s.isSliding ? 35 : 70;

      // --- Spawn obstacles ---
      s.nextObstacleIn--;
      if (s.nextObstacleIn <= 0) {
        const types: ObstacleType[] = ["BARRIER", "BLOCK", "GAP", "MOVING"];
        const type = types[Math.floor(Math.random() * types.length)];
        const lane = Math.floor(Math.random() * 3);
        const isMoving = type === "MOVING";
        s.obstacles.push({
          id: s.nextId++,
          type,
          lane,
          y: roadTop,
          width: laneWidth * 0.8,
          height: type === "GAP" ? 40 : type === "BARRIER" ? 70 : 50,
          moveDir: isMoving ? (Math.random() > 0.5 ? 1 : -1) : 0,
          moveTimer: 0,
        });
        s.nextObstacleIn = 80 + Math.floor(Math.random() * 40);
      }

      // --- Spawn coins ---
      s.nextCoinIn--;
      if (s.nextCoinIn <= 0) {
        const lane = Math.floor(Math.random() * 3);
        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          s.coinItems.push({
            id: s.nextId++,
            lane,
            y: roadTop - i * 30,
            collected: false,
          });
        }
        s.nextCoinIn = 60;
      }

      // --- Spawn energy pickups ---
      s.nextEnergyIn--;
      if (s.nextEnergyIn <= 0) {
        const lane = Math.floor(Math.random() * 3);
        s.energyPickups.push({
          id: s.nextId++,
          lane,
          y: roadTop,
        });
        s.nextEnergyIn = 200;
      }

      // --- Move obstacles ---
      s.obstacles = s.obstacles.filter((obs) => {
        obs.y += s.gameSpeed;
        if (obs.type === "MOVING") {
          obs.moveTimer++;
          if (obs.moveTimer >= 60) {
            obs.lane += obs.moveDir;
            if (obs.lane < 0) {
              obs.lane = 0;
              obs.moveDir = 1;
            }
            if (obs.lane > 2) {
              obs.lane = 2;
              obs.moveDir = -1;
            }
            obs.moveTimer = 0;
          }
        }
        return obs.y < canvasHeight + 100;
      });

      // --- Move coins ---
      s.coinItems = s.coinItems.filter((c) => {
        c.y += s.gameSpeed;
        return c.y < canvasHeight + 50;
      });

      // --- Move energy pickups ---
      s.energyPickups = s.energyPickups.filter((e) => {
        e.y += s.gameSpeed;
        return e.y < canvasHeight + 50;
      });

      // --- Collision detection ---
      if (s.invincibleFrame <= 0) {
        for (const obs of s.obstacles) {
          const obsX = laneXCenters[obs.lane];
          const obsY = obs.y;
          const obsW = obs.width;
          const obsH = obs.height;

          // Bounding box overlap
          const overlapX =
            Math.abs(playerX - obsX) < playerW * 0.5 + obsW * 0.5;
          const overlapY =
            Math.abs(playerDrawY - obsY) < playerH * 0.5 + obsH * 0.5;

          if (overlapX && overlapY) {
            if (obs.type === "GAP") {
              if (!s.isJumping) {
                // Fell in gap → game over
                s.isAlive = false;
                onGameOver(Math.floor(s.score), s.coins);
                return;
              }
            } else {
              // Hit obstacle
              s.energy = Math.max(0, s.energy - 20);
              s.hitFrame = 20;
              s.invincibleFrame = 60;
              if (s.energy <= 0) {
                s.isAlive = false;
                onGameOver(Math.floor(s.score), s.coins);
                return;
              }
            }
          }
        }
      }

      // --- Coin collection ---
      for (const coin of s.coinItems) {
        if (coin.collected) continue;
        const coinX = laneXCenters[coin.lane];
        const coinY = coin.y;
        const overlapX = Math.abs(playerX - coinX) < playerW;
        const overlapY = Math.abs(playerDrawY - coinY) < 30;
        if (overlapX && overlapY) {
          coin.collected = true;
          s.coins++;
        }
      }
      s.coinItems = s.coinItems.filter((c) => !c.collected);

      // --- Energy pickup collection ---
      s.energyPickups = s.energyPickups.filter((ep) => {
        const epX = laneXCenters[ep.lane];
        const overlapX = Math.abs(playerX - epX) < 40;
        const overlapY = Math.abs(playerDrawY - ep.y) < 40;
        if (overlapX && overlapY) {
          s.energy = Math.min(100, s.energy + 30);
          return false;
        }
        return true;
      });
    },
    [],
  );

  return { stateRef, reset, getState, actions, tick };
}
