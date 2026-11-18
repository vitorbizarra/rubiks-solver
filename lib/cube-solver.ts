import {
	Cube,
	initSolver,
	solve,
} from "rubik-solver";

let solverInitialized = false;

export type CubeSolution = {
	algorithm: string;
	moves: string[];
	moveCount: number;
};

export function solveCube(facelets: string): CubeSolution {
	if (facelets.length !== 54 || !/^[URFDLB]{54}$/.test(facelets)) {
		throw new Error("Invalid cube facelet string.");
	}

	if (!solverInitialized) {
		initSolver();
		solverInitialized = true;
	}

	const cube = Cube.fromString(facelets);
	const algorithm = solve(cube);

	if (algorithm === null) {
		throw new Error("No solution found for this cube.");
	}

	const verificationCube = Cube.fromString(facelets);
	verificationCube.move(algorithm);

	const verified = verificationCube.isSolved();

	console.log("Solver input:", facelets);
	console.log("Solver algorithm:", algorithm);
	console.log("Solution verified:", verified);
	console.log("Resulting cube:", verificationCube.asString());

	if (!verified) {
		throw new Error("The generated solution failed verification.");
	}

	const moves = algorithm.trim()
		? algorithm.trim().split(/\s+/)
		: [];

	console.log("Solver moves:", moves);
	console.log("Solver move count:", moves.length);

	return {
		algorithm,
		moves,
		moveCount: moves.length,
	};
}
