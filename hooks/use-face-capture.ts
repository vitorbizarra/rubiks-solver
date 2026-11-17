
import { useState } from "react";

import {
	CALIBRATION_COLORS,
	type CubeColor,
} from "@/lib/color-types";

import {
	FACE_ORDER,
	getFaceGuide,
	isCompleteFace,
	type CubeFace,
} from "@/lib/face-capture-guide";

export function useFaceCapture(colors: CubeColor[]) {
	const [capturedFaces, setCapturedFaces] = useState<CubeColor[][]>([]);
	const [editingFace, setEditingFace] = useState<CubeFace | null>(null);

	const currentIndex = editingFace
		? FACE_ORDER.indexOf(editingFace)
		: capturedFaces.length;

	const currentFace = FACE_ORDER[currentIndex];
	const currentGuide = getFaceGuide(currentFace);

	const canCaptureFace =
		isCompleteFace(colors) && currentIndex < 6;

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

	const cubeValid =
		capturedFaces.length === 6 &&
		centersValid &&
		colorCountsValid;

	function captureFace() {
		if (!canCaptureFace) return;

		setCapturedFaces((current) => {
			const updated = [...current];
			updated[currentIndex] = [...colors];
			return updated;
		});

		setEditingFace(null);
	}

	function editFace(face: CubeFace) {
		const index = FACE_ORDER.indexOf(face);

		if (index < 0 || index >= capturedFaces.length) return;

		setEditingFace(face);
	}

	function resetFaceCapture() {
		setCapturedFaces([]);
		setEditingFace(null);
	}

	function resetLastFace() {
		if (capturedFaces.length === 0) return;

		setCapturedFaces((current) => current.slice(0, -1));
		setEditingFace(null);
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
		editingFace,
		captureFace,
		editFace,
		resetFaceCapture,
		resetLastFace,
	};
}
