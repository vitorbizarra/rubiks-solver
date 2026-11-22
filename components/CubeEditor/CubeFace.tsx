
import { useState } from "react";

import {
  Matrix4,
  Quaternion,
  Vector3,
} from "three";

import {
  CUBE_COLORS,
  type CubeColor,
  type CubeFace as CubeFaceType,
} from "@/lib/cube-types";

type CubeFaceProps = {
  face: CubeFaceType;
  colors: (CubeColor | null)[];
  onStickerClick: (face: CubeFaceType, index: number) => void;
  isDark: boolean;
};

const FACE_LAYOUTS: Record<
  CubeFaceType,
  {
    normal: Vector3;
    right: Vector3;
    up: Vector3;
  }
> = {
  U: {
    normal: new Vector3(0, 1, 0),
    right: new Vector3(1, 0, 0),
    up: new Vector3(0, 0, -1),
  },
  R: {
    normal: new Vector3(1, 0, 0),
    right: new Vector3(0, 0, -1),
    up: new Vector3(0, 1, 0),
  },
  F: {
    normal: new Vector3(0, 0, 1),
    right: new Vector3(1, 0, 0),
    up: new Vector3(0, 1, 0),
  },
  D: {
    normal: new Vector3(0, -1, 0),
    right: new Vector3(1, 0, 0),
    up: new Vector3(0, 0, 1),
  },
  L: {
    normal: new Vector3(-1, 0, 0),
    right: new Vector3(0, 0, 1),
    up: new Vector3(0, 1, 0),
  },
  B: {
    normal: new Vector3(0, 0, -1),
    right: new Vector3(-1, 0, 0),
    up: new Vector3(0, 1, 0),
  },
};

export default function CubeFace({
  face,
  colors,
  onStickerClick,
  isDark,
}: CubeFaceProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const layout = FACE_LAYOUTS[face];

  const matrix = new Matrix4().makeBasis(
    layout.right,
    layout.up,
    layout.normal
  );

  const quaternion = new Quaternion().setFromRotationMatrix(matrix);

  return (
    <group>
      {Array.from({ length: 9 }, (_, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;

        const position = layout.normal
          .clone()
          .multiplyScalar(1.515)
          .addScaledVector(layout.right, col - 1)
          .addScaledVector(layout.up, 1 - row);

        const color = CUBE_COLORS.find(
          (item) => item.id === colors[index]
        );

        const isHovered = hoveredIndex === index;

        return (
          <mesh
            key={`${face}-${index}`}
            position={position}
            quaternion={quaternion}
            onClick={(event) => {
              event.stopPropagation();
              onStickerClick(face, index);
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              setHoveredIndex(index);
            }}
            onPointerOut={() => setHoveredIndex(null)}
          >
            <planeGeometry args={[0.94, 0.94]} />
            <meshStandardMaterial
              color={color?.hex ?? (isDark ? "#292929" : "#707070")}
              emissive={isHovered ? "#ffffff" : "#000000"}
              emissiveIntensity={isHovered ? 0.08 : 0}
              roughness={0.65}
              metalness={0}
              wireframe={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
