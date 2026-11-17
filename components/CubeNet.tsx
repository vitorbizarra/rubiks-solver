
"use client";

import {
  COLOR_INFO,
  type CubeColor,
} from "@/lib/color-types";

import {
  FACE_ORDER,
  type CubeFace,
} from "@/lib/face-capture-guide";

type CubeNetProps = {
  capturedFaces: CubeColor[][];
  currentFace?: CubeFace;
  liveColors: CubeColor[];
  mirrored: boolean;
};

const NET_LAYOUT: (CubeFace | null)[][] = [
  [null, "U", null, null],
  ["L", "F", "R", "B"],
  [null, "D", null, null],
];

const FACE_LABELS: Record<CubeFace, string> = {
  U: "Up",
  R: "Right",
  F: "Front",
  D: "Down",
  L: "Left",
  B: "Back",
};

export function CubeNet({
  capturedFaces,
  currentFace,
  liveColors,
  mirrored
}: CubeNetProps) {
  function getCapturedFace(face: CubeFace) {
    return capturedFaces[FACE_ORDER.indexOf(face)];
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">
          Cube
        </span>
        <span className="text-[10px] tabular-nums text-gray-400">
          {capturedFaces.length}/6 faces
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {NET_LAYOUT.flatMap((row, rowIndex) =>
          row.map((face, columnIndex) => {
            if (!face) {
              return (
                <div
                  key={`${rowIndex}-${columnIndex}`}
                  className="aspect-square"
                />
              );
            }

            const capturedColors = getCapturedFace(face);
            const isCaptured = Boolean(capturedColors);
            const isCurrent = currentFace === face;

            const displayedColors = isCaptured
              ? capturedColors
              : isCurrent
                ? liveColors
                : [];

            return (
              <div
                key={face}
                className={`min-w-0 rounded-md border p-1 ${isCurrent
                  ? "border-blue-400 bg-blue-400/10"
                  : isCaptured
                    ? "border-white/20 bg-white/5"
                    : "border-white/10 bg-black/30"
                  }`}
              >
                <div className="mb-1 flex items-center justify-between gap-1">
                  <span className="text-[9px] font-bold text-white">
                    {face}
                  </span>
                  <span className="truncate text-[8px] text-gray-400">
                    {isCaptured
                      ? "Captured"
                      : isCurrent
                        ? "Live"
                        : FACE_LABELS[face]}
                  </span>
                </div>

                <div
                  className="grid grid-cols-3 gap-[2px]"
                  style={{
                    transform: mirrored ? "scaleX(-1)" : "none",
                  }}
                >
                  {Array.from({ length: 9 }, (_, index) => {
                    const color: CubeColor =
                      displayedColors[index] ?? "unknown";

                    return (
                      <div
                        key={index}
                        className={`aspect-square rounded-[2px] ${COLOR_INFO[color].className
                          } ${isCurrent && !isCaptured
                            ? "ring-1 ring-white/10"
                            : ""
                          }`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
