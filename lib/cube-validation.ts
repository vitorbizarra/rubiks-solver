import {
	CUBE_COLORS,
	type CubeColor,
	type CubeFace,
	type CubeState,
} from "@/lib/cube-types";

import { validateCubeLegality } from "@/lib/cube-legality";

export type CubeValidationResult = {
	valid: boolean;
	errors: string[];
};

const FACES: CubeFace[] = [
	"U",
	"R",
	"F",
	"D",
	"L",
	"B",
];

export function validateCube(
	cube: CubeState
): CubeValidationResult {
	const errors: string[] = [];
	const colorCounts = new Map<CubeColor, number>();

	for (const color of CUBE_COLORS) {
		colorCounts.set(color.id, 0);
	}

	let filledCount = 0;

	for (const face of FACES) {
		for (const color of cube[face]) {
			if (color === null) {
				continue;
			}

			filledCount++;

			colorCounts.set(
				color,
				(colorCounts.get(color) ?? 0) + 1
			);
		}
	}

	if (filledCount !== 54) {
		errors.push(
			`The cube has ${54 - filledCount} unpainted stickers.`
		);
	}

	for (const color of CUBE_COLORS) {
		const count = colorCounts.get(color.id) ?? 0;

		if (count !== 9) {
			errors.push(
				`${color.label} appears ${count} times. Expected 9.`
			);
		}
	}

	const centerColors = FACES.map(
		(face) => cube[face][4]
	);

	if (centerColors.some((color) => color === null)) {
		errors.push("All six center stickers must be painted.");
	}

	const uniqueCenters = new Set(centerColors);

	if (uniqueCenters.size !== 6) {
		errors.push(
			"Each face must have a different center color."
		);
	}

	if (errors.length === 0) {
		errors.push(...validateCubeLegality(cube));
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}