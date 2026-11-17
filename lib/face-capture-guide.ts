
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
		instruction: "Tilt the cube forward until its top face points directly at the camera.",
		orientation: "Keep the cube's front side facing you. The U face must fill the scan grid.",
	},
	F: {
		name: "Front",
		title: "Front face",
		instruction: "Return the cube to its initial position, with U on top and F facing the camera.",
		orientation: "Keep the cube's layers aligned. The F face must fill the scan grid.",
	},
	R: {
		name: "Right",
		title: "Right face",
		instruction: "Rotate the entire cube to the right until the R face points directly at the camera.",
		orientation: "Keep U on top and all layers aligned. Do not turn individual layers.",
	},
	B: {
		name: "Back",
		title: "Back face",
		instruction: "Continue rotating the entire cube until the B face points directly at the camera.",
		orientation: "Keep U on top and all layers aligned. Do not turn individual layers.",
	},
	L: {
		name: "Left",
		title: "Left face",
		instruction: "Continue rotating the entire cube until the L face points directly at the camera.",
		orientation: "Keep U on top and all layers aligned. Do not turn individual layers.",
	},
	D: {
		name: "Down",
		title: "Bottom face",
		instruction: "Tilt the cube backward until its bottom face points directly at the camera.",
		orientation: "Keep the cube's layers aligned. The D face must fill the scan grid.",
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
