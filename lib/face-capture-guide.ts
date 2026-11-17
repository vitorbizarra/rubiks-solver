
import type { CubeColor } from "@/lib/color-types";

export type CubeFace = "U" | "R" | "F" | "D" | "L" | "B";

export type FaceGuide = {
	name: string;
	title: string;
	instruction: string;
	orientation: string;
};

export const FACE_ORDER: CubeFace[] = [
	"U",
	"F",
	"R",
	"B",
	"L",
	"D",
];

export const FACE_GUIDES: Record<CubeFace, FaceGuide> = {
	U: {
		name: "Up",
		title: "Top face",
		instruction: "Hold the cube with the U face pointing directly at the camera.",
		orientation: "Keep the cube aligned. The U face must fill the scan grid.",
	},
	F: {
		name: "Front",
		title: "Front face",
		instruction: "After capturing U, tilt the cube forward until U faces upward and F faces the camera.",
		orientation: "Keep the cube aligned. Do not rotate individual layers.",
	},
	R: {
		name: "Right",
		title: "Right face",
		instruction: "Rotate the entire cube 90° to the right until R faces the camera.",
		orientation: "Keep U facing upward. Do not turn individual layers.",
	},
	B: {
		name: "Back",
		title: "Back face",
		instruction: "Continue rotating the entire cube 90° in the same direction until B faces the camera.",
		orientation: "Keep U facing upward. Do not turn individual layers.",
	},
	L: {
		name: "Left",
		title: "Left face",
		instruction: "Continue rotating the entire cube 90° in the same direction until L faces the camera.",
		orientation: "Keep U facing upward. Do not turn individual layers.",
	},
	D: {
		name: "Down",
		title: "Bottom face",
		instruction: "After capturing L, tilt the cube until D faces the camera.",
		orientation: "Keep the cube aligned. Do not rotate individual layers.",
	},
};

export function getFaceGuide(face: CubeFace | undefined): FaceGuide | null {
	return face ? FACE_GUIDES[face] : null;
}

export function isCompleteFace(colors: CubeColor[]): boolean {
	return (
		colors.length === 9 &&
		colors.every((color) => color !== "unknown")
	);
}
