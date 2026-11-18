import type {
	CubeFace,
	CubeState,
} from "@/lib/cube-types";

type StickerPosition = {
	face: CubeFace;
	index: number;
};

const CORNER_FACELETS: StickerPosition[][] = [
	[
		{ face: "U", index: 8 },
		{ face: "R", index: 0 },
		{ face: "F", index: 2 },
	],
	[
		{ face: "U", index: 6 },
		{ face: "F", index: 0 },
		{ face: "L", index: 2 },
	],
	[
		{ face: "U", index: 0 },
		{ face: "L", index: 0 },
		{ face: "B", index: 2 },
	],
	[
		{ face: "U", index: 2 },
		{ face: "B", index: 0 },
		{ face: "R", index: 2 },
	],
	[
		{ face: "D", index: 2 },
		{ face: "F", index: 8 },
		{ face: "R", index: 6 },
	],
	[
		{ face: "D", index: 0 },
		{ face: "L", index: 8 },
		{ face: "F", index: 6 },
	],
	[
		{ face: "D", index: 6 },
		{ face: "B", index: 8 },
		{ face: "L", index: 6 },
	],
	[
		{ face: "D", index: 8 },
		{ face: "R", index: 8 },
		{ face: "B", index: 6 },
	],
];

const EDGE_FACELETS: StickerPosition[][] = [
	[
		{ face: "U", index: 5 },
		{ face: "R", index: 1 },
	],
	[
		{ face: "U", index: 7 },
		{ face: "F", index: 1 },
	],
	[
		{ face: "U", index: 3 },
		{ face: "L", index: 1 },
	],
	[
		{ face: "U", index: 1 },
		{ face: "B", index: 1 },
	],
	[
		{ face: "D", index: 5 },
		{ face: "R", index: 7 },
	],
	[
		{ face: "D", index: 1 },
		{ face: "F", index: 7 },
	],
	[
		{ face: "D", index: 3 },
		{ face: "L", index: 7 },
	],
	[
		{ face: "D", index: 7 },
		{ face: "B", index: 7 },
	],
	[
		{ face: "F", index: 5 },
		{ face: "R", index: 3 },
	],
	[
		{ face: "F", index: 3 },
		{ face: "L", index: 5 },
	],
	[
		{ face: "B", index: 5 },
		{ face: "L", index: 3 },
	],
	[
		{ face: "B", index: 3 },
		{ face: "R", index: 5 },
	],
];

const CORNER_PIECES: CubeFace[][] = [
	["U", "R", "F"],
	["U", "F", "L"],
	["U", "L", "B"],
	["U", "B", "R"],
	["D", "F", "R"],
	["D", "L", "F"],
	["D", "B", "L"],
	["D", "R", "B"],
];

const EDGE_PIECES: CubeFace[][] = [
	["U", "R"],
	["U", "F"],
	["U", "L"],
	["U", "B"],
	["D", "R"],
	["D", "F"],
	["D", "L"],
	["D", "B"],
	["F", "R"],
	["F", "L"],
	["B", "L"],
	["B", "R"],
];

function getPermutationParity(permutation: number[]): number {
	let inversions = 0;

	for (let i = 0; i < permutation.length; i++) {
		for (let j = i + 1; j < permutation.length; j++) {
			if (permutation[i] > permutation[j]) {
				inversions++;
			}
		}
	}

	return inversions % 2;
}

export function validateCubeLegality(cube: CubeState): string[] {
	const errors: string[] = [];

	const colorToFace = new Map<string, CubeFace>();

	const faces: CubeFace[] = [
		"U",
		"R",
		"F",
		"D",
		"L",
		"B",
	];

	for (const face of faces) {
		const centerColor = cube[face][4];

		if (centerColor === null) {
			return ["All center stickers must be painted."];
		}

		colorToFace.set(centerColor, face);
	}

	const getFaceColor = (
		position: StickerPosition
	): CubeFace | null => {
		const color = cube[position.face][position.index];

		if (color === null) {
			return null;
		}

		return colorToFace.get(color) ?? null;
	};

	const cornerPermutation: number[] = [];
	const cornerOrientations: number[] = [];

	for (const corner of CORNER_FACELETS) {
		const colors = corner.map(getFaceColor);

		if (colors.some((color) => color === null)) {
			errors.push("Some corner stickers do not match any center color.");
			continue;
		}

		const orientation = colors.findIndex(
			(color) => color === "U" || color === "D"
		);

		if (orientation === -1) {
			errors.push("A corner piece has no U or D color.");
			continue;
		}

		const first = colors[(orientation + 1) % 3];
		const second = colors[(orientation + 2) % 3];

		const pieceIndex = CORNER_PIECES.findIndex(
			(piece) =>
				piece[1] === first &&
				piece[2] === second
		);

		if (pieceIndex === -1) {
			errors.push("A corner contains an invalid color combination.");
			continue;
		}

		cornerPermutation.push(pieceIndex);
		cornerOrientations.push(orientation % 3);
	}

	if (cornerPermutation.length === 8) {
		if (new Set(cornerPermutation).size !== 8) {
			errors.push("A corner piece is duplicated or missing.");
		}

		const orientationSum = cornerOrientations.reduce(
			(sum, orientation) => sum + orientation,
			0
		);

		if (orientationSum % 3 !== 0) {
			errors.push("The total corner twist is invalid.");
		}
	}

	const edgePermutation: number[] = [];
	const edgeOrientations: number[] = [];

	for (const edge of EDGE_FACELETS) {
		const colors = edge.map(getFaceColor);

		if (colors.some((color) => color === null)) {
			errors.push("Some edge stickers do not match any center color.");
			continue;
		}

		const pieceIndex = EDGE_PIECES.findIndex(
			(piece) =>
				(piece[0] === colors[0] && piece[1] === colors[1]) ||
				(piece[0] === colors[1] && piece[1] === colors[0])
		);

		if (pieceIndex === -1) {
			errors.push("An edge contains an invalid color combination.");
			continue;
		}

		const piece = EDGE_PIECES[pieceIndex];

		edgePermutation.push(pieceIndex);
		edgeOrientations.push(
			piece[0] === colors[0] ? 0 : 1
		);
	}

	if (edgePermutation.length === 12) {
		if (new Set(edgePermutation).size !== 12) {
			errors.push("An edge piece is duplicated or missing.");
		}

		const orientationSum = edgeOrientations.reduce(
			(sum, orientation) => sum + orientation,
			0
		);

		if (orientationSum % 2 !== 0) {
			errors.push("The total edge flip is invalid.");
		}
	}

	if (
		cornerPermutation.length === 8 &&
		edgePermutation.length === 12 &&
		new Set(cornerPermutation).size === 8 &&
		new Set(edgePermutation).size === 12
	) {
		const cornerParity = getPermutationParity(cornerPermutation);
		const edgeParity = getPermutationParity(edgePermutation);

		if (cornerParity !== edgeParity) {
			errors.push("Corner and edge permutation parity do not match.");
		}
	}

	return [...new Set(errors)];
}
