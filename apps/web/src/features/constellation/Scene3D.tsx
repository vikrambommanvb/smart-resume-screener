import * as React from "react";
import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { SkillsSectionData } from "../../types/api";

interface Scene3DProps {
  skills: SkillsSectionData | null;
  onSelectSkill?: (skillName: string) => void;
}

interface NodeData3D {
  id: string;
  name: string;
  type: "matched" | "partial" | "missing";
  position: [number, number, number];
  color: string;
}

const ConstellationNodes: React.FC<{
  nodes: NodeData3D[];
  onSelectSkill?: (name: string) => void;
}> = ({ nodes, onSelectSkill }) => {
  const groupRef = React.useRef<THREE.Group | null>(null);
  const [hovered, setHovered] = React.useState<string | null>(null);

  // Gentle floating rotation: <= 0.1 rad/sec
  useFrame((_, delta) => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  // Pre-create spoke lines as Three.js Line objects
  const spokes = React.useMemo(() => {
    return nodes.map((node) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(...node.position),
      ]);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(node.color),
        transparent: true,
        opacity: 0.35,
      });
      const line = new THREE.Line(geo, mat);
      return { id: node.id, line, mat };
    });
  }, [nodes]);

  return (
    <group ref={groupRef}>
      {/* Center Hub: Target Role */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#7C5CFF" emissive="#7C5CFF" emissiveIntensity={0.6} />
      </mesh>

      {/* Spoke Lines */}
      {spokes.map(({ id, line }) => (
        <primitive key={`spoke-${id}`} object={line} />
      ))}

      {/* Nodes */}
      {nodes.map((node) => {
        const isHovered = hovered === node.id;

        return (
          <mesh
            key={node.id}
            position={node.position}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHovered(node.id);
              if (typeof document !== "undefined") {
                document.body.style.cursor = "pointer";
              }
            }}
            onPointerOut={() => {
              setHovered(null);
              if (typeof document !== "undefined") {
                document.body.style.cursor = "auto";
              }
            }}
            onClick={() => onSelectSkill?.(node.name)}
          >
            {node.type === "matched" && (
              <sphereGeometry args={[isHovered ? 0.22 : 0.16, 16, 16]} />
            )}
            {node.type === "partial" && (
              <octahedronGeometry args={[isHovered ? 0.22 : 0.16, 0]} />
            )}
            {node.type === "missing" && (
              <torusGeometry args={[isHovered ? 0.20 : 0.15, 0.035, 12, 24]} />
            )}
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={isHovered ? 0.9 : 0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export const Scene3D: React.FC<Scene3DProps> = ({ skills, onSelectSkill }) => {
  const matched = skills?.matched || [];
  const partial = skills?.partial || [];
  const missing = skills?.missing || [];

  const nodes: NodeData3D[] = React.useMemo(() => {
    const rawList = [
      ...matched.map((m) => ({ id: m.id, name: m.name, type: "matched" as const, color: "#B3A1FF" })),
      ...partial.map((p) => ({ id: p.id, name: p.name, type: "partial" as const, color: "#8DB4FF" })),
      ...missing.map((g) => ({ id: g.id, name: g.name, type: "missing" as const, color: "#FFB547" })),
    ];

    const total = rawList.length;
    return rawList.map((item, idx) => {
      const phi = Math.acos(-1 + (2 * idx) / Math.max(1, total));
      const theta = Math.sqrt(total * Math.PI) * phi;
      const radius = 2.2 + (idx % 3) * 0.4;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi) * 0.7; // slight vertical compression
      const z = radius * Math.cos(phi);

      return {
        ...item,
        position: [x, y, z] as [number, number, number],
      };
    });
  }, [matched, partial, missing]);

  return (
    <div className="relative w-full h-[360px] rounded-[8px] overflow-hidden bg-paper border border-rule">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.0} />
        <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.6} />
        <ConstellationNodes nodes={nodes} onSelectSkill={onSelectSkill} />
      </Canvas>
    </div>
  );
};

export default Scene3D;
