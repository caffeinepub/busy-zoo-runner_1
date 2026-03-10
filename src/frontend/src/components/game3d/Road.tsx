import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import type { GameState3D } from "../../hooks/useGameEngine";

const SEGMENT_LENGTH = 20;
const NUM_SEGMENTS = 8;

interface RoadProps {
  stateRef: React.MutableRefObject<GameState3D>;
}

export default function Road({ stateRef }: RoadProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const offsetRef = useRef(0);

  useFrame(() => {
    const s = stateRef.current;
    if (!groupRef.current) return;
    offsetRef.current = (offsetRef.current + s.gameSpeed) % SEGMENT_LENGTH;
    groupRef.current.position.z = offsetRef.current;
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: NUM_SEGMENTS }, (_, i) => {
        const z = -i * SEGMENT_LENGTH;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static geometry, never reordered
          <group key={`seg-${i}`} position={[0, 0, z]}>
            {/* Road surface */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, -0.01, 0]}
              receiveShadow
            >
              <planeGeometry args={[9, SEGMENT_LENGTH]} />
              <meshStandardMaterial
                color="#4a4a5c"
                roughness={0.9}
                metalness={0.05}
              />
            </mesh>

            {/* Lane divider at x=-1.5 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, 0.01, 0]}>
              <planeGeometry args={[0.08, SEGMENT_LENGTH]} />
              <meshStandardMaterial color="white" opacity={0.45} transparent />
            </mesh>

            {/* Lane divider at x=1.5 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.5, 0.01, 0]}>
              <planeGeometry args={[0.08, SEGMENT_LENGTH]} />
              <meshStandardMaterial color="white" opacity={0.45} transparent />
            </mesh>

            {/* Yellow left edge */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.45, 0.02, 0]}>
              <planeGeometry args={[0.12, SEGMENT_LENGTH]} />
              <meshStandardMaterial color="#ffdd33" />
            </mesh>

            {/* Yellow right edge */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.45, 0.02, 0]}>
              <planeGeometry args={[0.12, SEGMENT_LENGTH]} />
              <meshStandardMaterial color="#ffdd33" />
            </mesh>

            {/* Curb left */}
            <mesh position={[-4.65, 0.06, 0]} receiveShadow>
              <boxGeometry args={[0.3, 0.12, SEGMENT_LENGTH]} />
              <meshStandardMaterial color="#ccccdd" roughness={0.8} />
            </mesh>

            {/* Curb right */}
            <mesh position={[4.65, 0.06, 0]} receiveShadow>
              <boxGeometry args={[0.3, 0.12, SEGMENT_LENGTH]} />
              <meshStandardMaterial color="#ccccdd" roughness={0.8} />
            </mesh>

            {/* Left grass */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7.5, -0.02, 0]}>
              <planeGeometry args={[6, SEGMENT_LENGTH]} />
              <meshStandardMaterial color="#3a8a28" roughness={1} />
            </mesh>

            {/* Right grass */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7.5, -0.02, 0]}>
              <planeGeometry args={[6, SEGMENT_LENGTH]} />
              <meshStandardMaterial color="#3a8a28" roughness={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
