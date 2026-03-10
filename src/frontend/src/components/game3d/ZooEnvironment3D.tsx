import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import type { GameState3D } from "../../hooks/useGameEngine";

interface ZooEnvironmentProps {
  stateRef: React.MutableRefObject<GameState3D>;
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.22, 1.6, 8]} />
        <meshStandardMaterial color="#6b3a1f" roughness={1} />
      </mesh>
      {/* Lower foliage */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[1.1, 1.8, 8]} />
        <meshStandardMaterial color="#2d6e1a" roughness={0.9} />
      </mesh>
      {/* Upper foliage */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[0.85, 2.0, 8]} />
        <meshStandardMaterial color="#3a8a28" roughness={0.9} />
      </mesh>
      {/* Top tip */}
      <mesh position={[0, 3.4, 0]} castShadow>
        <coneGeometry args={[0.5, 1.2, 6]} />
        <meshStandardMaterial color="#4aa030" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Lamppost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.07, 3.2, 6]} />
        <meshStandardMaterial color="#5a5060" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Lamp head */}
      <mesh position={[0.3, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial
          color="#ffee88"
          emissive="#ffcc44"
          emissiveIntensity={1.0}
        />
      </mesh>
      {/* Arm */}
      <mesh position={[0.15, 1.42, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.45, 6]} />
        <meshStandardMaterial color="#5a5060" metalness={0.6} roughness={0.4} />
      </mesh>
      <pointLight
        color="#ffe880"
        intensity={0.8}
        distance={5}
        position={[0.3, 1.5, 0]}
      />
    </group>
  );
}

function FenceSection({
  startZ,
  length,
  x,
}: {
  startZ: number;
  length: number;
  x: number;
}) {
  return (
    <group>
      {/* Lower rail */}
      <mesh position={[x, 0.65, startZ - length / 2]}>
        <boxGeometry args={[0.07, 0.07, length]} />
        <meshStandardMaterial color="#c8a840" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Upper rail */}
      <mesh position={[x, 1.3, startZ - length / 2]}>
        <boxGeometry args={[0.07, 0.07, length]} />
        <meshStandardMaterial color="#c8a840" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Poles */}
      {Array.from({ length: Math.ceil(length / 3) + 1 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static geometry, never reordered
        <mesh key={`pole-${i}`} position={[x, 0.97, startZ - i * 3]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 2.0, 6]} />
          <meshStandardMaterial
            color="#c8a840"
            metalness={0.3}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

const TREE_SPACING = 7;
const NUM_TREES = 14;
const LEFT_X = -7.2;
const RIGHT_X = 7.2;

export default function ZooEnvironment3D({ stateRef }: ZooEnvironmentProps) {
  const leftGroupRef = useRef<THREE.Group>(null!);
  const rightGroupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    const s = stateRef.current;
    if (leftGroupRef.current) {
      leftGroupRef.current.position.z = s.envOffset;
    }
    if (rightGroupRef.current) {
      rightGroupRef.current.position.z = s.envOffset;
    }
  });

  const treeZPositions = Array.from(
    { length: NUM_TREES },
    (_, i) => -i * TREE_SPACING,
  );

  const totalLength = NUM_TREES * TREE_SPACING;

  return (
    <>
      {/* Left side */}
      <group ref={leftGroupRef}>
        {treeZPositions.map((z) => (
          <Tree key={`lt${z}`} position={[LEFT_X - 1.2, 0, z]} />
        ))}

        {/* Fence along left side */}
        <FenceSection startZ={0} length={totalLength} x={LEFT_X + 0.3} />

        {/* Lampposts every 14 units */}
        {Array.from({ length: 8 }, (_, i) => (
          <Lamppost
            key={`llp-z${i * 14}`}
            position={[LEFT_X + 0.5, 0, -i * 14]}
          />
        ))}
      </group>

      {/* Right side */}
      <group ref={rightGroupRef}>
        {treeZPositions.map((z) => (
          <Tree key={`rt${z}`} position={[RIGHT_X + 1.2, 0, z]} />
        ))}

        {/* Fence along right side */}
        <FenceSection startZ={0} length={totalLength} x={RIGHT_X - 0.3} />

        {/* Lampposts every 14 units */}
        {Array.from({ length: 8 }, (_, i) => (
          <Lamppost
            key={`rlp-z${i * 14}`}
            position={[RIGHT_X - 0.5, 0, -i * 14]}
          />
        ))}
      </group>

      {/* Static far background mountains */}
      <mesh position={[-20, 4, -80]}>
        <coneGeometry args={[12, 16, 6]} />
        <meshStandardMaterial color="#2a4a1a" roughness={1} />
      </mesh>
      <mesh position={[0, 3, -90]}>
        <coneGeometry args={[14, 13, 6]} />
        <meshStandardMaterial color="#1e3a14" roughness={1} />
      </mesh>
      <mesh position={[20, 5, -85]}>
        <coneGeometry args={[10, 18, 6]} />
        <meshStandardMaterial color="#2a4a1a" roughness={1} />
      </mesh>
    </>
  );
}
