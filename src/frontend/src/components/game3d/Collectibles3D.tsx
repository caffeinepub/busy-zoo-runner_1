import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import {
  type Coin3D,
  type EnergyPickup3D,
  type GameState3D,
  getLaneX,
} from "../../hooks/useGameEngine";

interface CollectiblesProps {
  stateRef: React.MutableRefObject<GameState3D>;
}

function CoinMesh({ coin }: { coin: Coin3D }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const x = getLaneX(coin.lane);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.05;
      meshRef.current.position.y =
        0.85 + Math.sin(Date.now() * 0.003 + x * 1.3) * 0.1;
    }
  });

  return (
    <group position={[x, 0.85, coin.z]}>
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.12, 16]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#aa7700"
          emissiveIntensity={0.35}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
      <pointLight color="#ffcc00" intensity={0.4} distance={2.5} />
    </group>
  );
}

function EnergyMesh({ pickup }: { pickup: EnergyPickup3D }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const x = getLaneX(pickup.lane);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.04;
      meshRef.current.rotation.z += 0.02;
      meshRef.current.position.y =
        1.0 + Math.sin(Date.now() * 0.002 + x) * 0.15;
    }
  });

  return (
    <group position={[x, 1.0, pickup.z]}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial
          color="#40c8ff"
          emissive="#0088ff"
          emissiveIntensity={0.8}
          transparent
          opacity={0.92}
          metalness={0.2}
          roughness={0.1}
        />
      </mesh>
      {/* Inner glow sphere */}
      <mesh>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshBasicMaterial color="#80e8ff" opacity={0.4} transparent />
      </mesh>
      <pointLight color="#40c8ff" intensity={1.2} distance={3.5} />
    </group>
  );
}

export default function Collectibles3D({ stateRef }: CollectiblesProps) {
  const s = stateRef.current;

  return (
    <>
      {s.coinItems.map((c) => (
        <CoinMesh key={c.id} coin={c} />
      ))}
      {s.energyPickups.map((e) => (
        <EnergyMesh key={e.id} pickup={e} />
      ))}
    </>
  );
}
