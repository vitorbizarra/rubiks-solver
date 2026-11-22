import type {
	CubeColor,
	CubeFace,
	CubeState,
} from "@/lib/cube-types";

const FACE_ORDER: CubeFace[] = [
	"U",
	"R",
	"F",
	"D",
	"L",
	"B",
];

export function getCubeAtMove(
	initialCube: CubeState,
	states: string[],
	completedMoves: number
): CubeState {
	const facelets = states[completedMoves];

	if (!facelets || facelets.length !== 54) {
		return initialCube;
	}

	const faceToColor = {} as Record<CubeFace, CubeColor>;

	for (const face of FACE_ORDER) {
		const color = initialCube[face][4];

		if (color === null) {
			throw new Error("All center stickers must be painted.");
		}

		faceToColor[face] = color;
	}

	const result = {} as CubeState;

	FACE_ORDER.forEach((face, faceIndex) => {
		result[face] = facelets
			.slice(faceIndex * 9, faceIndex * 9 + 9)
			.split("")
			.map((faceLetter) => {
				return faceToColor[faceLetter as CubeFace];
			});
	});

	return result;
}