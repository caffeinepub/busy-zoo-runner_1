# Busy Zoo Runner

## Current State
- Fully functional 2D canvas-based endless runner game
- GameScreen.tsx: uses HTML5 Canvas + 2D drawing helpers for all rendering (player, obstacles, coins, energy pickups, zoo background, HUD)
- useGameEngine.ts: pure JS game logic with ref-based state, lane-switching, jump/slide, collision detection, scoring
- StartScreen, GameOverScreen, ShopScreen: 2D UI screens with motion animations
- Dependencies already include @react-three/fiber, @react-three/drei, @react-three/cannon, three

## Requested Changes (Diff)

### Add
- Full 3D game rendering using React Three Fiber + @react-three/drei
- 3D GameScene component: Three.js Canvas with perspective camera (slightly behind and above player)
- 3D player character: a stylized boy mesh built from Three.js geometry (box/cylinder/sphere composites), running animation using useFrame rotations
- 3D road/track: infinite scrolling ground plane with 3 lane markings (white dashed lines)
- 3D obstacles: box meshes for BARRIER/BLOCK, gap (missing ground segment), spinning diamond for MOVING
- 3D coins: golden torus/cylinder meshes with rotation animation
- 3D energy pickups: emissive blue sphere/octahedron mesh
- 3D zoo environment: side scenery with 3D cage fences, stylized tree cones, simple animal silhouette meshes scrolling past
- 3D sky: gradient or hemisphere light + fog for depth
- HUD overlaid as React DOM (not Three.js) - score, coins, energy bar on top of canvas
- StartScreen: add a rotating 3D animal/scene preview using Three.js Canvas (small banner) while keeping the 2D UI
- Smooth lane transition animation (lerp player X position in 3D space)
- Jump and slide animations in 3D (Y translation for jump, scaleY for slide)

### Modify
- GameScreen.tsx: replace Canvas 2D rendering with React Three Fiber <Canvas> component; keep the same touch/keyboard controls and on-screen buttons
- useGameEngine.ts: adapt coordinate system for 3D (Z moves toward camera instead of Y down the screen); keep all game logic intact
- App.tsx: no structural changes needed

### Remove
- All 2D canvas drawing helpers (drawCloud, drawAnimal, drawObstacle, drawCoin, drawEnergyPickup, drawFallbackBoy, drawFallbackZooBg, drawHUD, drawElephant, drawGiraffe, drawMonkey, drawLion, drawFallbackZooBg, drawLion)
- bgImgRef and boyImgRef image loading in GameScreen
- canvas ref and 2D context usage

## Implementation Plan
1. Create `src/frontend/src/hooks/useGameEngine3D.ts`: adapt game engine for 3D coordinates (Z-axis for forward movement, X for lane position, Y for jump). Keep same logic, expose positions/states for 3D rendering.
2. Create `src/frontend/src/components/game3d/` directory with:
   - `GameScene3D.tsx`: main R3F Canvas, camera, lights, fog
   - `Road.tsx`: tiled road segments that scroll, lane lines
   - `Player3D.tsx`: composite mesh boy, running/jump/slide animations
   - `Obstacle3D.tsx`: per-type 3D obstacle meshes
   - `Coin3D.tsx`: spinning gold coin mesh
   - `EnergyPickup3D.tsx`: pulsing energy orb
   - `ZooEnvironment3D.tsx`: scrolling trees, fences, animal silhouettes on both sides
3. Update `GameScreen.tsx`: replace 2D canvas with GameScene3D + R3F Canvas; overlay DOM HUD and control buttons
4. Update `StartScreen.tsx`: add a small R3F rotating 3D animal preview scene in the title area
