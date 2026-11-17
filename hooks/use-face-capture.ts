
import { useState } from "react";

import {
	CALIBRATION_COLORS,
	type CubeColor,
} from "@/lib/color-types";

import {
	FACE_ORDER,
	getFaceGuide,
	isCompleteFace,
} from "@/lib/face-capture-guide";

export function useFaceCapture(colors: CubeColor[]) {
	const [capturedFaces, setCapturedFaces] = useState<CubeColor[][]>([]);

	const currentFace = FACE_ORDER[capturedFaces.length];
	const currentGuide = getFaceGuide(currentFace);

	const canCaptureFace =
		isCompleteFace(colors) && capturedFaces.length < 6;

	const capturedColorCounts = CALIBRATION_COLORS.map((color) => ({
		color,
		count: capturedFaces
			.flat()
			.filter((capturedColor) => capturedColor === color).length,
	}));

	const centers = capturedFaces.map((face) => face[4]);

	const centersValid =
		centers.length === 6 &&
		centers.every((color) => color !== "unknown") &&
		new Set(centers).size === 6;

	const colorCountsValid = capturedColorCounts.every(
		({ count }) => count === 9
	);

	const validationErrors: string[] = [];

	if (capturedFaces.length < 6) {
		validationErrors.push("Capture all six faces.");
	} else {
		if (!centersValid) {
			validationErrors.push(
				"Each face must have a different center color."
			);
		}

		for (const { color, count } of capturedColorCounts) {
			if (count !== 9) {
				validationErrors.push(
					`${color} must appear exactly 9 times. Currently: ${count}.`
				);
			}
		}
	}

	const cubeValid =
		capturedFaces.length === 6 &&
		centersValid &&
		colorCountsValid;

	function captureFace() {
		if (!canCaptureFace) return;

		setCapturedFaces((current) => [
			...current,
			[...colors],
		]);
	}

	function resetLastFace() {
		setCapturedFaces((current) => current.slice(0, -1));
	}

	function resetFaceCapture() {
		setCapturedFaces([]);
	}

	return {
		capturedFaces,
		currentFace,
		currentGuide,
		canCaptureFace,
		capturedColorCounts,
		centersValid,
		colorCountsValid,
		cubeValid,
		validationErrors,
		captureFace,
		resetLastFace,
		resetFaceCapture,
	};
}
