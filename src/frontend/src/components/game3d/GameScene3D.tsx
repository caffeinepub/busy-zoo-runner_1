import { Sky } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useState } from "react";
import type { GameState3D } from "../../hooks/useGameEngine";
import Collectibles3D from "./Collectibles3D";
import Obstacles3D from "./Obstacles3D";
import Player3D from "./Player3D";
import Road from "./Road";
import ZooEnvironment3D from "./ZooEnvironment3D";

interface GameScene3DProps {
  onGameOver: (score: number, coins: number) => void;
  stateRef: React.MutableRefObject<GameState3D>;
  tick: (onGameOver: (score: number, coins: number) => void) => void;
}

function SceneContent({ onGameOver, stateRef, tick }: GameScene3DProps) {
  // Force React re-render every frame so obstacles/collectibles show updated positions
  const [, forceUpdate] = useState(0);

  useFrame(() => {
    tick(onGameOver);
    forceUpdate((n) => (n + 1) & 0xffff);
  });

  return (
    <>
      {/* Sky */}
      <Sky
        sunPosition={[100, 30, 100]}
        turbidity={0.6}
        rayleigh={0.5}
        mieCoefficient={0.003}
        mieDirectionalG={0.8}
        inclination={0.49}
      />

      {/* Fog for depth */}
      <fog attach="fog" args={["#b8d8f8", 18, 75]} />

      {/* Ambient fill */}
      <ambientLight intensity={0.65} color="#d0e8ff" />

      {/* Primary sun light */}
      <directionalLight
        position={[6, 14, 8]}
        intensity={1.4}
        color="#fff8e8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      {/* Cool fill from opposite side */}
      <directionalLight
        position={[-4, 6, -12]}
        intensity={0.35}
        color="#88aaff"
      />

      {/* Ground bounce */}
      <hemisphereLight args={["#ddf0ff", "#3a8a28", 0.4]} />

      <Road stateRef={stateRef} />
      <ZooEnvironment3D stateRef={stateRef} />
      <Player3D stateRef={stateRef} />
      <Obstacles3D stateRef={stateRef} />
      <Collectibles3D stateRef={stateRef} />
    </>
  );
}

export default function GameScene3D({
  onGameOver,
  stateRef,
  tick,
}: GameScene3DProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 4.5, 7], fov: 62, near: 0.1, far: 200 }}
      style={{ width: "100%", height: "100%" }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      }}
    >
      <Suspense fallback={null}>
        <SceneContent onGameOver={onGameOver} stateRef={stateRef} tick={tick} />
      </Suspense>
    </Canvas>
  );
}
