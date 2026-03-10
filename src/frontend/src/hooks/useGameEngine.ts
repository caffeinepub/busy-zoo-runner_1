import { useCallback, useRef } from "react";

export type ObstacleType = "BARRIER" | "BLOCK" | "GAP" | "MOVING";

export interface Obstacle3D {
  id: number;
  type: ObstacleType;
  lane: number;
  z: number;
  width: number;
  height: number;
  moveDir: number;
  moveTimer: number;
}

export interface Coin3D {
  id: number;
  lane: number;
  z: number;
  collected: boolean;
}

export interface EnergyPickup3D {
  id: number;
  lane: number;
  z: number;
}

export interface GameState3D {
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
  obstacles: Obstacle3D[];
  coinItems: Coin3D[];
  energyPickups: EnergyPickup3D[];
  envOffset: number;
  nextObstacleIn: number;
  nextCoinIn: number;
  nextEnergyIn: number;
  nextId: number;
}

const LANE_POSITIONS = [-3, 0, 3];
const SPAWN_Z = -60;
const DESPAWN_Z = 8;
const PLAYER_Z = 0;

export function createInitialState3D(): GameState3D {
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
    gameSpeed: 0.25,
    frame: 0,
    obstacles: [],
    coinItems: [],
    energyPickups: [],
    envOffset: 0,
    nextObstacleIn: 80,
    nextCoinIn: 60,
    nextEnergyIn: 200,
    nextId: 0,
  };
}

export interface GameActions {
  jump: () => void;
  slide: () => void;
  moveLeft: () => void;
  moveRight: () => void;
}

export function getLaneX(lane: number): number {
  return LANE_POSITIONS[lane] ?? 0;
}

export function useGameEngine() {
  const stateRef = useRef<GameState3D>(createInitialState3D());

  const reset = useCallback(() => {
    stateRef.current = createInitialState3D();
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
    (onGameOver: (score: number, coins: number) => void) => {
      const s = stateRef.current;
      if (!s.isAlive) return;

      s.gameSpeed += 0.0001;
      s.score += s.gameSpeed * 10;
      s.frame++;

      s.energy = Math.max(0, s.energy - 0.05);
      if (s.energy <= 0) {
        s.isAlive = false;
        onGameOver(Math.floor(s.score), s.coins);
        return;
      }

      // Jump arc
      const JUMP_DURATION = 40;
      if (s.isJumping) {
        s.jumpFrame++;
        const progress = s.jumpFrame / JUMP_DURATION;
        s.playerY = Math.sin(progress * Math.PI) * 2.5;
        if (s.jumpFrame >= JUMP_DURATION) {
          s.isJumping = false;
          s.jumpFrame = 0;
          s.playerY = 0;
        }
      }

      // Slide
      const SLIDE_DURATION = 30;
      if (s.isSliding) {
        s.slideFrame++;
        if (s.slideFrame >= SLIDE_DURATION) {
          s.isSliding = false;
          s.slideFrame = 0;
        }
      }

      if (s.hitFrame > 0) s.hitFrame--;
      if (s.invincibleFrame > 0) s.invincibleFrame--;

      s.envOffset = (s.envOffset + s.gameSpeed) % 20;

      // Spawn obstacles
      s.nextObstacleIn--;
      if (s.nextObstacleIn <= 0) {
        const types: ObstacleType[] = ["BARRIER", "BLOCK", "GAP", "MOVING"];
        const type = types[Math.floor(Math.random() * types.length)];
        const lane = Math.floor(Math.random() * 3);
        s.obstacles.push({
          id: s.nextId++,
          type,
          lane,
          z: SPAWN_Z,
          width: 1.8,
          height: type === "BARRIER" ? 1.4 : type === "GAP" ? 0.2 : 1.0,
          moveDir: type === "MOVING" ? (Math.random() > 0.5 ? 1 : -1) : 0,
          moveTimer: 0,
        });
        s.nextObstacleIn = 80 + Math.floor(Math.random() * 40);
      }

      // Spawn coins
      s.nextCoinIn--;
      if (s.nextCoinIn <= 0) {
        const lane = Math.floor(Math.random() * 3);
        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          s.coinItems.push({
            id: s.nextId++,
            lane,
            z: SPAWN_Z - i * 3,
            collected: false,
          });
        }
        s.nextCoinIn = 60;
      }

      // Spawn energy
      s.nextEnergyIn--;
      if (s.nextEnergyIn <= 0) {
        const lane = Math.floor(Math.random() * 3);
        s.energyPickups.push({ id: s.nextId++, lane, z: SPAWN_Z });
        s.nextEnergyIn = 200;
      }

      // Move obstacles
      s.obstacles = s.obstacles.filter((obs) => {
        obs.z += s.gameSpeed;
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
        return obs.z < DESPAWN_Z;
      });

      s.coinItems = s.coinItems.filter((c) => {
        c.z += s.gameSpeed;
        return c.z < DESPAWN_Z;
      });

      s.energyPickups = s.energyPickups.filter((e) => {
        e.z += s.gameSpeed;
        return e.z < DESPAWN_Z;
      });

      // Collision detection
      const playerX = getLaneX(s.lane);
      const playerActualY = s.playerY;
      const playerW = 1.0;
      const playerH = s.isSliding ? 0.6 : 1.2;

      if (s.invincibleFrame <= 0) {
        for (const obs of s.obstacles) {
          const obsX = getLaneX(obs.lane);
          const overlapX =
            Math.abs(playerX - obsX) < playerW * 0.5 + obs.width * 0.5;
          const overlapZ = Math.abs(PLAYER_Z - obs.z) < 1.2;
          const overlapY = playerActualY < obs.height * 0.5 + playerH * 0.5;

          if (overlapX && overlapZ && overlapY) {
            if (obs.type === "GAP") {
              if (!s.isJumping) {
                s.isAlive = false;
                onGameOver(Math.floor(s.score), s.coins);
                return;
              }
            } else {
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

      // Coin collection
      for (const coin of s.coinItems) {
        if (coin.collected) continue;
        const coinX = getLaneX(coin.lane);
        if (
          Math.abs(playerX - coinX) < 1.2 &&
          Math.abs(PLAYER_Z - coin.z) < 1.0
        ) {
          coin.collected = true;
          s.coins++;
        }
      }
      s.coinItems = s.coinItems.filter((c) => !c.collected);

      // Energy pickup
      s.energyPickups = s.energyPickups.filter((ep) => {
        const epX = getLaneX(ep.lane);
        if (Math.abs(playerX - epX) < 1.2 && Math.abs(PLAYER_Z - ep.z) < 1.2) {
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
