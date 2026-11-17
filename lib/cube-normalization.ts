
import type { CubeColor } from "@/lib/color-types";
import { CALIBRATION_COLORS } from "@/lib/color-types";

import {
	FACE_ORDER,
	type CubeFace,
} from "@/lib/face-capture-guide";

export type NormalizedCube = {
	facelets: string;
	colorToFace: Partial<Record<CubeColor, CubeFace>>;
};

const SOLVER_FACE_ORDER: CubeFace[] = [
	"U",
	"R",
	"F",
	"D",
	"L",
	"B",
];

function rotateFaceClockwise(colors: CubeColor[]): CubeColor[] {
	return [
		colors[6],
		colors[3],
		colors[0],
		colors[7],
		colors[4],
		colors[1],
		colors[8],
		colors[5],
		colors[2],
	];
}

export function normalizeCubeColors(
	capturedFaces: CubeColor[][]
): NormalizedCube {
	if (capturedFaces.length !== 6) {
		throw new Error("Exactly six faces must be captured.");
	}

	if (capturedFaces.some((face) => face.length !== 9)) {
		throw new Error("Each face must contain exactly nine colors.");
	}

	const colorToFace: Partial<Record<CubeColor, CubeFace>> = {};

	for (let index = 0; index < FACE_ORDER.length; index++) {
		const face = FACE_ORDER[index];
		const centerColor = capturedFaces[index][4];

		if (centerColor === "unknown") {
			throw new Error(`Face ${face} has an unknown center.`);
		}

		if (colorToFace[centerColor]) {
			throw new Error("Each face must have a unique center color.");
		}

		colorToFace[centerColor] = face;
	}

	const colorCounts = new Map<CubeColor, number>();

	for (const face of capturedFaces) {
		for (const color of face) {
			if (color === "unknown") {
				throw new Error("The cube contains unidentified colors.");
			}

			colorCounts.set(
				color,
				(colorCounts.get(color) ?? 0) + 1
			);
		}
	}

	for (const color of CALIBRATION_COLORS) {
		const count = colorCounts.get(color) ?? 0;

		if (count !== 9) {
			throw new Error(
				`Color ${color} must appear exactly 9 times. Found ${count}.`
			);
		}
	}

	const facelets = SOLVER_FACE_ORDER
		.map((face) => {
			const captureIndex = FACE_ORDER.indexOf(face);

			const capturedColors = capturedFaces[captureIndex];

			const colors = face === "D"
				? rotateFaceClockwise(capturedColors)
				: capturedColors;

			return colors
				.map((color) => {
					const mappedFace = colorToFace[color];

					if (!mappedFace) {
						throw new Error(
							`Color ${color} has no matching center.`
						);
					}

					return mappedFace;
				})
				.join("");
		})
		.join("");

	return {
		facelets,
		colorToFace,
	};
}
