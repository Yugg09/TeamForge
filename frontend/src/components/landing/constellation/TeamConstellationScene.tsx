import { useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  CONSTELLATION_LINKS,
  CONSTELLATION_NODES,
  FORMATION_INDICES,
  type ConstellationPointer,
} from "./constellation-data";

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function formationPhase(cycle: number) {
  const highlight = cycle < 0.42 ? 0 : cycle < 0.52 ? smoothstep(0.42, 0.52, cycle) : cycle < 0.88 ? 1 : 1 - smoothstep(0.88, 0.98, cycle);
  const gather =
    cycle < 0.52 ? 0 : cycle < 0.68 ? smoothstep(0.52, 0.68, cycle) : cycle < 0.8 ? 1 : 1 - smoothstep(0.8, 0.92, cycle);
  return { highlight, gather, formed: gather > 0.92 };
}

const FORMING = new Set<number>(FORMATION_INDICES);

function SkillOrb({
  color,
  label,
  highlighted,
}: {
  color: string;
  label: string;
  highlighted: number;
}) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const hover = useRef(0);

  useFrame((_, delta) => {
    hover.current = THREE.MathUtils.damp(
      hover.current,
      hovered ? 1 : 0,
      8,
      delta,
    );
    const scale = 1 + hover.current * 0.22 + highlighted * 0.16;
    group.current?.scale.setScalar(scale);
    if (inner.current) {
      inner.current.emissiveIntensity = 0.55 + highlighted * 0.9 + hover.current * 0.4;
    }
  });

  return (
    <group ref={group}>
      <mesh
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.15, 40, 40]} />
        <meshPhysicalMaterial
          color="#FFFFFF"
          metalness={0.12}
          roughness={0.18}
          clearcoat={0.7}
          clearcoatRoughness={0.2}
          transparent
          opacity={0.82 + highlighted * 0.12}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.05, 20, 20]} />
        <meshStandardMaterial
          ref={inner}
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          roughness={0.3}
        />
      </mesh>
      <Html position={[0, 0.26, 0]} center style={{ pointerEvents: "none" }}>
        <div
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: highlighted > 0.5 ? "#0A0A0A" : "#525252",
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(10,10,10,0.12)",
            borderRadius: "999px",
            padding: "3px 8px",
            whiteSpace: "nowrap",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 20px rgba(23,23,23,0.05)",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function DustField() {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const array = new Float32Array(120 * 3);
    for (let i = 0; i < 120; i += 1) {
      array[i * 3] = (Math.random() - 0.5) * 8;
      array[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
      array[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return array;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.018;
      points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.04;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#A3A3A3"
        transparent
        opacity={0.42}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function ConstellationRig({
  pointer,
}: {
  pointer: MutableRefObject<ConstellationPointer>;
}) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const nodeGroups = useRef<(THREE.Group | null)[]>([]);
  const line = useRef<THREE.LineSegments>(null);
  const [highlight, setHighlight] = useState(0);
  const [formed, setFormed] = useState(false);

  const rest = useMemo(
    () => CONSTELLATION_NODES.map((node) => new THREE.Vector3(...node.rest)),
    [],
  );
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const gathered = useMemo(() => new THREE.Vector3(), []);
  const slotOf = useMemo(() => {
    const map = new Map<number, number>();
    FORMATION_INDICES.forEach((id, slot) => map.set(id, slot));
    return map;
  }, []);

  const lineCount = CONSTELLATION_LINKS.length;
  const linePositions = useMemo(() => new Float32Array(lineCount * 6), [lineCount]);
  const lineColors = useMemo(() => new Float32Array(lineCount * 6), [lineCount]);
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(linePositions, 3),
    );
    geometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
    return geometry;
  }, [linePositions, lineColors]);

  const dim = useMemo(() => new THREE.Color("#C4C4C4"), []);
  const bright = useMemo(() => new THREE.Color("#0A0A0A"), []);
  const mix = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const phase = formationPhase((t % 14) / 14);
    if (Math.abs(phase.highlight - highlight) > 0.04) {
      setHighlight(phase.highlight);
    }
    if (phase.formed !== formed) setFormed(phase.formed);

    CONSTELLATION_NODES.forEach((_, index) => {
      const home = rest[index];
      scratch.set(
        home.x + Math.sin(t * 0.22 + index * 0.8) * 0.08,
        home.y + Math.cos(t * 0.18 + index * 1.1) * 0.1,
        home.z + Math.sin(t * 0.16 + index * 0.6) * 0.08,
      );
      if (FORMING.has(index)) {
        const slot = slotOf.get(index) ?? 0;
        const angle = (slot / FORMATION_INDICES.length) * Math.PI * 2;
        gathered.set(
          Math.cos(angle) * 0.48,
          0.08 + Math.sin(angle) * 0.32,
          Math.sin(angle * 0.7) * 0.12,
        );
        scratch.lerp(gathered, phase.gather);
      }
      nodeGroups.current[index]?.position.copy(scratch);
    });

    CONSTELLATION_LINKS.forEach(([a, b], i) => {
      const from = nodeGroups.current[a]?.position;
      const to = nodeGroups.current[b]?.position;
      if (!from || !to) return;
      const offset = i * 6;
      linePositions[offset] = from.x;
      linePositions[offset + 1] = from.y;
      linePositions[offset + 2] = from.z;
      linePositions[offset + 3] = to.x;
      linePositions[offset + 4] = to.y;
      linePositions[offset + 5] = to.z;
      const active = FORMING.has(a) && FORMING.has(b) ? phase.highlight : 0;
      mix.copy(dim).lerp(bright, active);
      lineColors[offset] = mix.r;
      lineColors[offset + 1] = mix.g;
      lineColors[offset + 2] = mix.b;
      lineColors[offset + 3] = mix.r;
      lineColors[offset + 4] = mix.g;
      lineColors[offset + 5] = mix.b;
    });

    line.current?.geometry.getAttribute("position") &&
      (line.current.geometry.getAttribute("position").needsUpdate = true);
    line.current?.geometry.getAttribute("color") &&
      (line.current.geometry.getAttribute("color").needsUpdate = true);
    if (line.current && !Array.isArray(line.current.material)) {
      line.current.material.opacity = 0.22 + phase.highlight * 0.28;
    }

    if (core.current) {
      core.current.rotation.y = t * 0.16;
      core.current.rotation.x = t * 0.07;
      core.current.scale.setScalar(1 + phase.gather * 0.22 + Math.sin(t * 1.2) * 0.03);
    }
    if (ring.current) ring.current.rotation.z = t * 0.05;

    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        pointer.current.x * 0.38 + t * 0.045,
        0.035,
      );
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        0.12 + pointer.current.y * 0.16,
        0.035,
      );
    }
  });

  return (
    <group ref={group}>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.85, 0.006, 12, 120]} />
        <meshBasicMaterial color="#D4D4D4" transparent opacity={0.7} />
      </mesh>

      <group ref={core} position={[0, 0.05, 0]}>
        <mesh>
          <icosahedronGeometry args={[0.18, 0]} />
          <meshPhysicalMaterial
            color="#0A0A0A"
            metalness={0.35}
            roughness={0.22}
            clearcoat={0.8}
            emissive="#0A0A0A"
            emissiveIntensity={0.4 + highlight * 0.5}
          />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.28, 0]} />
          <meshBasicMaterial
            color="#737373"
            transparent
            opacity={0.1 + highlight * 0.08}
            depthWrite={false}
            wireframe
          />
        </mesh>
        {formed ? (
          <Html center style={{ pointerEvents: "none" }}>
            <div
              style={{
                marginTop: "56px",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#0A0A0A",
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(10,10,10,0.12)",
                borderRadius: "999px",
                padding: "5px 10px",
                backdropFilter: "blur(12px)",
              }}
            >
              Team formed
            </div>
          </Html>
        ) : null}
      </group>

      <lineSegments ref={line} geometry={lineGeometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </lineSegments>

      {CONSTELLATION_NODES.map((node, index) => (
        <group
          key={node.id}
          ref={(el) => {
            nodeGroups.current[index] = el;
          }}
          position={node.rest}
        >
          <SkillOrb
            color={node.color}
            label={node.label}
            highlighted={FORMING.has(index) ? highlight : 0}
          />
        </group>
      ))}
    </group>
  );
}

function Lights() {
  return (
    <>
      <hemisphereLight args={["#FFFFFF", "#E5E5E5", 0.95]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3.4, 4.6, 2.6]} intensity={1.2} color="#FFFFFF" />
      <directionalLight position={[-2.6, 1.2, -1.8]} intensity={0.22} color="#A3A3A3" />
      <pointLight position={[0.2, 0.6, 1.2]} intensity={0.35} color="#FFFFFF" distance={8} />
    </>
  );
}

export function TeamConstellationScene({
  pointer,
}: {
  pointer: MutableRefObject<ConstellationPointer>;
}) {
  return (
    <Canvas
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        premultipliedAlpha: true,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
      dpr={[1, 1.6]}
      camera={{ position: [0, 0.55, 5.6], fov: 38, near: 0.1, far: 24 }}
      frameloop="always"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: "transparent",
        touchAction: "none",
      }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.current.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      }}
      onPointerLeave={() => {
        pointer.current.x = 0;
        pointer.current.y = 0;
      }}
    >
      <Lights />
      <DustField />
      <ConstellationRig pointer={pointer} />
      <ContactShadows
        position={[0, -1.35, 0]}
        opacity={0.22}
        scale={10}
        blur={2.8}
        far={3}
        color="#171717"
      />
    </Canvas>
  );
}
