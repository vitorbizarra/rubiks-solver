
import type {
	CubeColor,
	CubeFace,
	CubeState,
} from "@/lib/cube-types";

export function createEmptyCube(): CubeState {
	return {
		U: Array(9).fill(null),
		R: Array(9).fill(null),
		F: Array(9).fill(null),
		D: Array(9).fill(null),
		L: Array(9).fill(null),
		B: Array(9).fill(null),
	};
}

export function paintSticker(
	cube: CubeState,
	face: CubeFace,
	index: number,
	color: CubeColor
): CubeState {
	return {
		...cube,
		[face]: cube[face].map((currentColor, currentIndex) =>
			currentIndex === index ? color : currentColor
		),
	};
}
