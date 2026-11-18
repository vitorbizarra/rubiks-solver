import { NextResponse } from "next/server";
import {
	Cube,
	initSolver,
	solve,
} from "rubik-solver";

let solverInitialized = false;

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const facelets = body.facelets;

		if (
			typeof facelets !== "string" ||
			!/^[URFDLB]{54}$/.test(facelets)
		) {
			return NextResponse.json(
				{ error: "Invalid cube representation." },
				{ status: 400 }
			);
		}

		const cube = Cube.fromString(facelets);
		const verification = cube.verify();

		if (verification !== true) {
			return NextResponse.json(
				{ error: String(verification) },
				{ status: 422 }
			);
		}

		if (!solverInitialized) {
			initSolver();
			solverInitialized = true;
		}

		const solution = solve(cube);

		if (!solution) {
			return NextResponse.json(
				{ error: "No solution found for this cube." },
				{ status: 422 }
			);
		}

		const moves = solution
			.trim()
			.split(/\s+/)
			.filter(Boolean);

		const playbackCube = Cube.fromString(facelets);

		const states = [playbackCube.asString()];

		for (const move of moves) {
			playbackCube.move(move);
			states.push(playbackCube.asString());
		}

		return NextResponse.json({
			solution,
			moves,
			moveCount: moves.length,
			states,
		});
	} catch {
		return NextResponse.json(
			{ error: "Failed to solve the cube." },
			{ status: 500 }
		);
	}
}