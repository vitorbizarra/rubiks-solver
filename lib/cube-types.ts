
export type CubeFace = "U" | "R" | "F" | "D" | "L" | "B";

export type CubeColor =
	| "white"
	| "yellow"
	| "red"
	| "orange"
	| "blue"
	| "green";

export type CubeState = Record<
	CubeFace,
	(CubeColor | null)[]
>;

export const CUBE_COLORS: {
	id: CubeColor;
	label: string;
	hex: string;
}[] = [
		{ id: "white", label: "White", hex: "#ffffff" },
		{ id: "yellow", label: "Yellow", hex: "#facc15" },
		{ id: "red", label: "Red", hex: "#ef4444" },
		{ id: "orange", label: "Orange", hex: "#f97316" },
		{ id: "blue", label: "Blue", hex: "#3b82f6" },
		{ id: "green", label: "Green", hex: "#22c55e" },
	];
