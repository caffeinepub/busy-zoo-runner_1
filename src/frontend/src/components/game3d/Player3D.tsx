import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { type GameState3D, getLaneX } from "../../hooks/useGameEngine";

interface Player3DProps {
  stateRef: React.MutableRefObject<GameState3D>;
}

const SKIN_COLOR = "#ffcc88";
const SHIRT_COLOR = "#ff6600";
const PANTS_COLOR = "#1144cc";
const SHOE_COLOR = "#222222";
const HAIR_COLOR = "#4a2a0a";

export default function Player3D({ stateRef }: Player3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const lerpXRef = useRef(0);
  const legLRef = useRef<THREE.Mesh>(null!);
  const legRRef = useRef<THREE.Mesh>(null!);
  const armLRef = useRef<THREE.Mesh>(null!);
  const armRRef = useRef<THREE.Mesh>(null!);
  const shadowRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    const s = stateRef.current;
    if (!groupRef.current) return;

    const targetX = getLaneX(s.lane);
    lerpXRef.current = THREE.MathUtils.lerp(lerpXRef.current, targetX, 0.15);

    const targetY = s.playerY + (s.isSliding ? 0.3 : 0.9);
    groupRef.current.position.x = lerpXRef.current;
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.2,
    );

    // Slide squash
    const targetScaleY = s.isSliding ? 0.5 : 1.0;
    const targetScaleX = s.isSliding ? 1.5 : 1.0;
    groupRef.current.scale.y = THREE.MathUtils.lerp(
      groupRef.current.scale.y,
      targetScaleY,
      0.2,
    );
    groupRef.current.scale.x = THREE.MathUtils.lerp(
      groupRef.current.scale.x,
      targetScaleX,
      0.2,
    );

    // Running leg/arm animation
    if (!s.isSliding && !s.isJumping) {
      const swing = Math.sin(s.frame * 0.3) * 0.6;
      if (legLRef.current) legLRef.current.rotation.x = swing;
      if (legRRef.current) legRRef.current.rotation.x = -swing;
      if (armLRef.current) armLRef.current.rotation.x = -swing * 0.7;
      if (armRRef.current) armRRef.current.rotation.x = swing * 0.7;
    } else if (s.isJumping) {
      if (legLRef.current) legLRef.current.rotation.x = -0.5;
      if (legRRef.current) legRRef.current.rotation.x = -0.5;
      if (armLRef.current) armLRef.current.rotation.x = -0.8;
      if (armRRef.current) armRRef.current.rotation.x = -0.8;
    }

    // Invincible flicker
    const visible = s.invincibleFrame <= 0 || s.frame % 4 < 3;
    groupRef.current.visible = visible;

    // Shadow scale with height
    if (shadowRef.current) {
      const shadowScale = Math.max(0.3, 1 - s.playerY * 0.2);
      shadowRef.current.scale.setScalar(shadowScale);
      shadowRef.current.position.y = -groupRef.current.position.y + 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.9, 0]}>
      {/* Ground shadow */}
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.89, 0]}
      >
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="black" opacity={0.28} transparent />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.55, 0.6, 0.3]} />
        <meshStandardMaterial color={SHIRT_COLOR} roughness={0.6} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <sphereGeometry args={[0.28, 14, 14]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.5} />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.09, 0.68, 0.27]}>
        <sphereGeometry args={[0.052, 8, 8]} />
        <meshBasicMaterial color="#222222" />
      </mesh>
      <mesh position={[-0.09, 0.68, 0.27]}>
        <sphereGeometry args={[0.052, 8, 8]} />
        <meshBasicMaterial color="#222222" />
      </mesh>

      {/* Eye whites */}
      <mesh position={[0.09, 0.68, 0.265]}>
        <sphereGeometry args={[0.072, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[-0.09, 0.68, 0.265]}>
        <sphereGeometry args={[0.072, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 0.82, 0]}>
        <sphereGeometry args={[0.3, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={HAIR_COLOR} roughness={0.8} />
      </mesh>

      {/* Left arm */}
      <mesh ref={armLRef} position={[-0.38, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.38, 4, 8]} />
        <meshStandardMaterial color={SHIRT_COLOR} roughness={0.6} />
      </mesh>

      {/* Right arm */}
      <mesh ref={armRRef} position={[0.38, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.38, 4, 8]} />
        <meshStandardMaterial color={SHIRT_COLOR} roughness={0.6} />
      </mesh>

      {/* Left leg */}
      <mesh ref={legLRef} position={[-0.18, -0.35, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.48, 4, 8]} />
        <meshStandardMaterial color={PANTS_COLOR} roughness={0.7} />
      </mesh>

      {/* Right leg */}
      <mesh ref={legRRef} position={[0.18, -0.35, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.48, 4, 8]} />
        <meshStandardMaterial color={PANTS_COLOR} roughness={0.7} />
      </mesh>

      {/* Left shoe */}
      <mesh position={[-0.18, -0.68, 0.06]}>
        <boxGeometry args={[0.26, 0.16, 0.38]} />
        <meshStandardMaterial
          color={SHOE_COLOR}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {/* Right shoe */}
      <mesh position={[0.18, -0.68, 0.06]}>
        <boxGeometry args={[0.26, 0.16, 0.38]} />
        <meshStandardMaterial
          color={SHOE_COLOR}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}
