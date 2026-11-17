
import type {
	CalibrationSettings,
	CubeColor,
	HSV,
	SampleArea,
	CalibratableColor,
} from "./color-types";

import { CALIBRATION_COLORS } from "./color-types";

export function rgbToHsv(r: number, g: number, b: number): HSV {
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;

	let hue = 0;

	if (delta !== 0) {
		if (max === r) {
			hue = 60 * (((g - b) / delta) % 6);
		} else if (max === g) {
			hue = 60 * ((b - r) / delta + 2);
		} else {
			hue = 60 * ((r - g) / delta + 4);
		}
	}

	if (hue < 0) hue += 360;

	return {
		hue,
		saturation: max === 0 ? 0 : delta / max,
		brightness: max,
	};
}

export function hueDistance(a: number, b: number): number {
	const difference = Math.abs(a - b);
	return Math.min(difference, 360 - difference);
}

export function getRingSamples(
	context: CanvasRenderingContext2D,
	area: SampleArea
): HSV[] {
	const x = Math.max(0, Math.floor(area.x));
	const y = Math.max(0, Math.floor(area.y));
	const size = Math.max(1, Math.floor(area.size));

	const width = Math.min(size, context.canvas.width - x);
	const height = Math.min(size, context.canvas.height - y);

	if (width <= 0 || height <= 0) return [];

	const image = context.getImageData(x, y, width, height);
	const samples: HSV[] = [];

	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			const normalizedX = (col + 0.5) / width;
			const normalizedY = (row + 0.5) / height;

			const edgeDistance = Math.max(
				Math.abs(normalizedX - 0.5),
				Math.abs(normalizedY - 0.5)
			);

			if (edgeDistance < 0.3 || edgeDistance > 0.49) {
				continue;
			}

			const index = (row * width + col) * 4;

			const r = image.data[index] / 255;
			const g = image.data[index + 1] / 255;
			const b = image.data[index + 2] / 255;

			const hsv = rgbToHsv(r, g, b);

			if (hsv.brightness < 0.12) continue;

			samples.push(hsv);
		}
	}

	return samples;
}

export function identifyColor(
	context: CanvasRenderingContext2D,
	area: SampleArea,
	calibration: CalibrationSettings
): CubeColor {
	const samples = getRingSamples(context, area);

	if (samples.length === 0) return "unknown";

	const votes: Record<CalibratableColor, number> = {
		white: 0,
		yellow: 0,
		orange: 0,
		red: 0,
		green: 0,
		blue: 0,
	};

	for (const sample of samples) {
		if (
			sample.saturation <= calibration.whiteSaturationMax &&
			sample.brightness >= calibration.whiteBrightnessMin
		) {
			votes.white += 1;
			continue;
		}

		if (sample.saturation < 0.28) continue;

		let bestColor: CalibratableColor | null = null;
		let bestDistance = Infinity;

		for (const color of CALIBRATION_COLORS) {
			if (color === "white") continue;

			const profile = calibration.profiles[color];
			const distance = hueDistance(sample.hue, profile.hue);

			if (distance < bestDistance) {
				bestDistance = distance;
				bestColor = color;
			}
		}

		if (!bestColor) continue;

		const profile = calibration.profiles[bestColor];

		if (bestDistance > profile.tolerance) continue;

		const confidence = 1 - bestDistance / profile.tolerance;
		const weight =
			sample.saturation *
			(0.5 + sample.brightness * 0.5) *
			(0.5 + confidence);

		votes[bestColor] += weight;
	}

	const totalVotes = Object.values(votes).reduce(
		(total, value) => total + value,
		0
	);

	const [bestColor, bestScore] = Object.entries(votes).reduce(
		(best, current) =>
			current[1] > best[1] ? current : best,
		["unknown", 0] as [string, number]
	);

	if (totalVotes === 0 || bestScore / totalVotes < 0.38) {
		return "unknown";
	}

	return bestColor as CubeColor;
}
