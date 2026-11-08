// 3D EV charger scene (react-three-fiber). Lazy load hota hai — Home ka pehla
// paint fast rahe. Koi model file nahi: sab geometry code se banti hai.
import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const CYAN = new THREE.Color("#22D3EE");
const VIOLET = new THREE.Color("#8B5CF6");

/* Screen par dikhne wali image — canvas se banti hai */
const makeScreenTexture = () => {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 320;
  const g = c.getContext("2d");
  const bg = g.createLinearGradient(0, 0, 0, 320);
  bg.addColorStop(0, "#0b1030");
  bg.addColorStop(1, "#140a33");
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 320);

  // ⚡ bolt
  g.save();
  g.translate(128, 112);
  g.scale(2.6, 2.6);
  const bolt = new Path2D("M4 -24 L-14 4 L-2 4 L-6 24 L14 -6 L2 -6 Z");
  const bg2 = g.createLinearGradient(-14, -24, 14, 24);
  bg2.addColorStop(0, "#22D3EE");
  bg2.addColorStop(1, "#8B5CF6");
  g.shadowColor = "#22D3EE";
  g.shadowBlur = 12;
  g.fillStyle = bg2;
  g.fill(bolt);
  g.restore();

  // battery bar
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 4;
  g.strokeRect(48, 210, 160, 34);
  const bar = g.createLinearGradient(52, 0, 204, 0);
  bar.addColorStop(0, "#22D3EE");
  bar.addColorStop(1, "#8B5CF6");
  g.fillStyle = bar;
  g.fillRect(54, 216, 118, 22);
  g.fillStyle = "rgba(255,255,255,0.35)";
  g.fillRect(208, 220, 8, 14);

  g.fillStyle = "#E2E8F0";
  g.font = "bold 30px Inter, Arial, sans-serif";
  g.textAlign = "center";
  g.fillText("78%", 128, 290);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/* Upar uthte energy particles */
const Particles = ({ count }) => {
  const ref = useRef();
  const { positions, colors, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 0.6 + Math.random() * 2.2;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = -1.4 + Math.random() * 4;
      positions[i * 3 + 2] = Math.sin(a) * r;
      const col = CYAN.clone().lerp(VIOLET, Math.random());
      colors.set([col.r, col.g, col.b], i * 3);
      speeds[i] = 0.25 + Math.random() * 0.6;
    }
    return { positions, colors, speeds };
  }, [count]);

  useFrame((_, dt) => {
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + speeds[i] * dt;
      if (y > 2.8) y = -1.4;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    ref.current.rotation.y += dt * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

/* Cable me daudti energy ki goliyan */
const EnergyPulses = ({ curve }) => {
  const refs = [useRef(), useRef(), useRef()];
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.forEach((r, i) => {
      if (!r.current) return;
      const p = (t * 0.35 + i / refs.length) % 1;
      r.current.position.copy(curve.getPointAt(p));
      r.current.scale.setScalar(0.8 + Math.sin(t * 6 + i) * 0.2);
    });
  });
  return refs.map((r, i) => (
    <mesh key={i} ref={r}>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshBasicMaterial color={i % 2 ? VIOLET : CYAN} toneMapped={false} />
    </mesh>
  ));
};

const Charger = ({ particleCount }) => {
  const group = useRef();
  const ring = useRef();
  const halo = useRef();
  const screenMat = useRef();

  const screenTex = useMemo(makeScreenTexture, []);
  const bodyGeo = useMemo(() => new RoundedBoxGeometry(1.1, 2.5, 0.6, 6, 0.14), []);
  const headGeo = useMemo(() => new RoundedBoxGeometry(1.24, 0.34, 0.7, 4, 0.1), []);

  // Cable: charger ki side se neeche ghoom ke plug tak
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.58, 0.35, 0.05),
        new THREE.Vector3(0.95, -0.15, 0.25),
        new THREE.Vector3(1.15, -0.95, 0.55),
        new THREE.Vector3(1.55, -1.05, 0.75),
        new THREE.Vector3(1.85, -0.55, 0.7),
        new THREE.Vector3(1.9, 0.05, 0.6),
      ]),
    []
  );
  const plugPos = useMemo(() => curve.getPointAt(1), [curve]);

  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();
    // Mouse ke saath halka ghoomna + tairna
    const targetY = -0.35 + state.pointer.x * 0.45;
    const targetX = 0.06 - state.pointer.y * 0.12;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 3, dt);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 3, dt);
    group.current.position.y = Math.sin(t * 1.1) * 0.06;
    ring.current.rotation.z += dt * 0.6;
    halo.current.rotation.z -= dt * 0.15;
    halo.current.rotation.y = Math.sin(t * 0.3) * 0.25;
    if (screenMat.current) screenMat.current.emissiveIntensity = 0.85 + Math.sin(t * 2.4) * 0.15;
  });

  return (
    <group ref={group} position={[0, -0.2, 0]}>
      {/* Peeche bada glowing halo */}
      <mesh ref={halo} position={[0, 0.5, -1.1]}>
        <torusGeometry args={[1.7, 0.018, 16, 160]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.5, -1.15]} rotation={[0, 0, Math.PI / 5]}>
        <torusGeometry args={[2.0, 0.008, 16, 160]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.35} toneMapped={false} />
      </mesh>

      {/* Base platform */}
      <mesh position={[0, -1.42, 0]} receiveShadow>
        <cylinderGeometry args={[1.45, 1.6, 0.16, 64]} />
        <meshStandardMaterial color="#1c2258" metalness={0.55} roughness={0.35} emissive="#140f3a" emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={ring} position={[0, -1.33, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.38, 0.025, 16, 128, Math.PI * 1.6]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </mesh>

      {/* Charger body */}
      <mesh geometry={bodyGeo} castShadow>
        <meshPhysicalMaterial color="#2a3378" metalness={0.45} roughness={0.3} clearcoat={1} clearcoatRoughness={0.2} />
      </mesh>
      <mesh geometry={headGeo} position={[0, 1.34, 0]}>
        <meshPhysicalMaterial color="#343f8f" metalness={0.5} roughness={0.25} clearcoat={1} />
      </mesh>
      {/* Head ki glowing strip */}
      <mesh position={[0, 1.34, 0.36]}>
        <boxGeometry args={[0.9, 0.05, 0.01]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </mesh>
      {/* Side light strips */}
      {[-0.56, 0.56].map((x) => (
        <mesh key={x} position={[x, 0, 0.18]}>
          <boxGeometry args={[0.025, 2.1, 0.025]} />
          <meshBasicMaterial color={VIOLET} toneMapped={false} />
        </mesh>
      ))}

      {/* Screen */}
      <mesh position={[0, 0.35, 0.305]}>
        <planeGeometry args={[0.78, 0.98]} />
        <meshStandardMaterial
          ref={screenMat}
          map={screenTex}
          emissiveMap={screenTex}
          emissive="#ffffff"
          emissiveIntensity={0.9}
          roughness={0.4}
        />
      </mesh>

      {/* Holster */}
      <mesh position={[0.6, 0.35, 0.05]}>
        <boxGeometry args={[0.16, 0.3, 0.3]} />
        <meshStandardMaterial color="#0d1130" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Cable + energy */}
      <mesh>
        <tubeGeometry args={[curve, 80, 0.035, 12, false]} />
        <meshStandardMaterial color="#10142e" metalness={0.3} roughness={0.5} />
      </mesh>
      <EnergyPulses curve={curve} />

      {/* Plug */}
      <group position={plugPos} rotation={[0, 0, -0.15]}>
        <mesh>
          <capsuleGeometry args={[0.09, 0.22, 6, 16]} />
          <meshPhysicalMaterial color="#1b2152" metalness={0.5} roughness={0.3} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 24]} />
          <meshBasicMaterial color={CYAN} toneMapped={false} />
        </mesh>
      </group>

      <Particles count={particleCount} />
    </group>
  );
};

const ChargerScene = ({ lowPower = false, paused = false }) => (
  <Canvas
    frameloop={paused ? "never" : "always"}
    dpr={lowPower ? [1, 1.5] : [1, 2]}
    camera={{ position: [0, 0.45, 7.3], fov: 38 }}
    gl={{ antialias: !lowPower, alpha: true, powerPreference: "high-performance" }}
    style={{ background: "transparent" }}
  >
    <ambientLight intensity={0.8} />
    <directionalLight position={[3, 5, 4]} intensity={1.1} />
    <pointLight position={[-3, 1.5, 2.5]} intensity={18} distance={12} color="#22D3EE" />
    <pointLight position={[3, -0.5, 2.5]} intensity={16} distance={12} color="#8B5CF6" />
    <Charger particleCount={lowPower ? 90 : 240} />
  </Canvas>
);

export default ChargerScene;
