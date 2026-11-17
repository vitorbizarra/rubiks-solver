
import type {
	CalibrationSettings,
	CalibratableColor,
	HSV,
} from "./color-types";

import {
	DEFAULT_CALIBRATION,
	CALIBRATION_STORAGE_KEY,
} from "./color-types";

export function loadCalibration(): CalibrationSettings {
	try {
		const saved = localStorage.getItem(CALIBRATION_STORAGE_KEY);

		if (!saved) return DEFAULT_CALIBRATION;

		const parsed = JSON.parse(saved) as Partial<CalibrationSettings>;

		return {
			...DEFAULT_CALIBRATION,
			...parsed,
			profiles: {
				...DEFAULT_CALIBRATION.profiles,
				...parsed.profiles,
			},
		};
	} catch {
		return DEFAULT_CALIBRATION;
	}
}

export function saveCalibration(
	calibration: CalibrationSettings
): void {
	try {
		localStorage.setItem(
			CALIBRATION_STORAGE_KEY,
			JSON.stringify(calibration)
		);
	} catch {
		return;
	}
}

export function resetCalibration(): CalibrationSettings {
	return DEFAULT_CALIBRATION;
}

function circularMeanHue(samples: HSV[]): number | null {
	if (samples.length === 0) return null;

	let sinSum = 0;
	let cosSum = 0;

	for (const sample of samples) {
		if (sample.saturation < 0.28 || sample.brightness < 0.15) {
			continue;
		}

		const radians = (sample.hue * Math.PI) / 180;
		const weight = sample.saturation * sample.brightness;

		sinSum += Math.sin(radians) * weight;
		cosSum += Math.cos(radians) * weight;
	}

	if (sinSum === 0 && cosSum === 0) return null;

	const angle = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;

	return (angle + 360) % 360;
}

export function calibrateColor(
	current: CalibrationSettings,
	color: CalibratableColor,
	samples: HSV[]
): { calibration: CalibrationSettings | null; message: string } {
	if (color === "white") {
		const whiteSamples = samples.filter(
			(sample) =>
				sample.saturation < 0.35 &&
				sample.brightness > 0.35
		);

		if (whiteSamples.length < 10) {
			return {
				calibration: null,
				message:
					"Not enough white pixels. Try adjusting the lighting or positioning.",
			};
		}

		const averageSaturation =
			whiteSamples.reduce(
				(total, sample) => total + sample.saturation,
				0
			) / whiteSamples.length;

		const averageBrightness =
			whiteSamples.reduce(
				(total, sample) => total + sample.brightness,
				0
			) / whiteSamples.length;

		return {
			calibration: {
				...current,
				whiteSaturationMax: Math.min(
					0.45,
					Math.max(0.15, averageSaturation + 0.12)
				),
				whiteBrightnessMin: Math.min(
					0.75,
					Math.max(0.25, averageBrightness - 0.2)
				),
			},
			message: "White calibration updated.",
		};
	}

	const hue = circularMeanHue(samples);

	if (hue === null) {
		return {
			calibration: null,
			message:
				"No reliable color samples found. Try again with better lighting.",
		};
	}

	return {
		calibration: {
			...current,
			profiles: {
				...current.profiles,
				[color]: {
					hue,
					tolerance: 28,
				},
			},
		},
		message: `${color.charAt(0).toUpperCase()}${color.slice(1)} calibration updated.`,
	};
}
