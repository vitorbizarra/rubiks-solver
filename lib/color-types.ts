
export type CubeColor =
	| "white"
	| "yellow"
	| "red"
	| "orange"
	| "green"
	| "blue"
	| "unknown";

export type CalibratableColor = Exclude<CubeColor, "unknown">;

export type ColorProfile = {
	hue: number;
	tolerance: number;
};

export type CalibrationSettings = {
	profiles: Record<CalibratableColor, ColorProfile>;
	whiteSaturationMax: number;
	whiteBrightnessMin: number;
};

export type HSV = {
	hue: number;
	saturation: number;
	brightness: number;
};

export type SampleArea = {
	x: number;
	y: number;
	size: number;
};

export const COLOR_INFO: Record<
	CubeColor,
	{ label: string; className: string }
> = {
	white: { label: "White", className: "bg-white" },
	yellow: { label: "Yellow", className: "bg-yellow-400" },
	red: { label: "Red", className: "bg-red-600" },
	orange: { label: "Orange", className: "bg-orange-500" },
	green: { label: "Green", className: "bg-green-600" },
	blue: { label: "Blue", className: "bg-blue-600" },
	unknown: { label: "Unknown", className: "bg-gray-600" },
};

export const CALIBRATION_COLORS: CalibratableColor[] = [
	"white",
	"yellow",
	"red",
	"orange",
	"green",
	"blue",
];

export const DEFAULT_CALIBRATION: CalibrationSettings = {
	profiles: {
		red: { hue: 0, tolerance: 24 },
		orange: { hue: 25, tolerance: 20 },
		yellow: { hue: 55, tolerance: 24 },
		green: { hue: 125, tolerance: 35 },
		blue: { hue: 220, tolerance: 45 },
		white: { hue: 0, tolerance: 30 },
	},
	whiteSaturationMax: 0.22,
	whiteBrightnessMin: 0.48,
};

export const CALIBRATION_STORAGE_KEY = "rubiks-solver-calibration";
