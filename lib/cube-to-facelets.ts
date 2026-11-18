import type {
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

export function cubeToFacelets(cube: CubeState): string {
	const colorToFace = new Map<string, CubeFace>();

	for (const face of FACE_ORDER) {
		const centerColor = cube[face][4];

		if (centerColor === null) {
			throw new Error("All center stickers must be painted.");
		}

		colorToFace.set(centerColor, face);
	}

	return FACE_ORDER
		.flatMap((face) => cube[face])
		.map((color) => {
			if (color === null) {
				throw new Error("The cube contains unpainted stickers.");
			}

			const face = colorToFace.get(color);

			if (!face) {
				throw new Error("Unknown cube color.");
			}

			return face;
		})
		.join("");
}