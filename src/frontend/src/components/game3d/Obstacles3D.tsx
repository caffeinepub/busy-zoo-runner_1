import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import {
  type GameState3D,
  type Obstacle3D,
  getLaneX,
} from "../../hooks/useGameEngine";

interface ObstaclesProps {
  stateRef: React.MutableRefObject<GameState3D>;
}

function BarrierMesh({ obs }: { obs: Obstacle3D }) {
  const x = getLaneX(obs.lane);
  const z = obs.z;
  return (
    <group position={[x, 0.7, z]}>
      {/* Main barrier body */}
      <mesh castShadow>
        <boxGeometry args={[1.8, 1.0, 0.22]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
      {/* White stripes overlay */}
      <mesh position={[0, 0, 0.12]}>
        <boxGeometry args={[1.7, 0.9, 0.02]} />
        <meshStandardMaterial color="#ffffff" opacity={0.25} transparent />
      </mesh>
      {/* Top warning bar */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.8, 0.12, 0.3]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#cc0000"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Support post */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.8, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

function BlockMesh({ obs }: { obs: Obstacle3D }) {
  const x = getLaneX(obs.lane);
  const z = obs.z;
  return (
    <group position={[x, 0.5, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.0, 1.0]} />
        <meshStandardMaterial color="#a07060" roughness={0.9} metalness={0.0} />
      </mesh>
      {/* Stone face lines */}
      <mesh position={[0, 0, 0.51]}>
        <planeGeometry args={[1.6, 1.0]} />
        <meshStandardMaterial
          color="#8a6050"
          opacity={0.6}
          transparent
          roughness={1}
        />
      </mesh>
    </group>
  );
}

function GapMesh({ obs }: { obs: Obstacle3D }) {
  const x = getLaneX(obs.lane);
  const z = obs.z;
  return (
    <group position={[x, -0.08, z]}>
      {/* Dark pit */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 2.8]} />
        <meshBasicMaterial color="#020208" />
      </mesh>
      {/* Glowing inner pit */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.3]}>
        <planeGeometry args={[1.4, 1.8]} />
        <meshBasicMaterial color="#1a0040" />
      </mesh>
      {/* Purple point light from below */}
      <pointLight
        color="#6600cc"
        intensity={1.2}
        distance={4}
        position={[0, -0.8, 0]}
      />
    </group>
  );
}

function MovingMesh({ obs }: { obs: Obstacle3D }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const x = getLaneX(obs.lane);
  const z = obs.z;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.05;
      meshRef.current.rotation.x += 0.03;
    }
  });

  return (
    <group position={[x, 0.8, z]}>
      <mesh ref={meshRef} castShadow>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ff4400"
          emissiveIntensity={0.5}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>
      <pointLight color="#ff8800" intensity={0.6} distance={3} />
    </group>
  );
}

export default function Obstacles3D({ stateRef }: ObstaclesProps) {
  const s = stateRef.current;

  return (
    <>
      {s.obstacles.map((obs) => {
        if (obs.type === "BARRIER")
          return <BarrierMesh key={obs.id} obs={obs} />;
        if (obs.type === "BLOCK") return <BlockMesh key={obs.id} obs={obs} />;
        if (obs.type === "GAP") return <GapMesh key={obs.id} obs={obs} />;
        if (obs.type === "MOVING") return <MovingMesh key={obs.id} obs={obs} />;
        return null;
      })}
    </>
  );
}
