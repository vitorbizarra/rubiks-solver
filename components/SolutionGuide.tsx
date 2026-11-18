"use client";

import { useEffect, useState } from "react";

type SolutionGuideProps = {
	moves: string[];
	onClose?: () => void;
};

const FACE_NAMES: Record<string, string> = {
	U: "Up",
	R: "Right",
	F: "Front",
	D: "Down",
	L: "Left",
	B: "Back",
};

export function SolutionGuide({
	moves,
	onClose,
}: SolutionGuideProps) {
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		setCurrentIndex(0);
	}, [moves]);

	const currentMove = moves[currentIndex];

	if (!currentMove) {
		return (
			<div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
				<p className="text-sm font-semibold text-green-300">
					Cube solved!
				</p>
				<p className="mt-1 text-xs text-green-200">
					All movements have been completed.
				</p>
				<button
					onClick={() => setCurrentIndex(0)}
					className="mt-3 w-full rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
				>
					Restart guide
				</button>
			</div>
		);
	}

	const face = currentMove[0];
	const isHalfTurn = currentMove.endsWith("2");
	const isCounterclockwise = currentMove.includes("'");

	const direction = isHalfTurn
		? "180 degrees"
		: isCounterclockwise
			? "counter-clockwise"
			: "clockwise";

	const instruction = isHalfTurn
		? `Turn the ${FACE_NAMES[face].toLowerCase()} face 180 degrees`
		: `Turn the ${FACE_NAMES[face].toLowerCase()} face ${direction}`;

	const progress = ((currentIndex + 1) / moves.length) * 100;

	function nextMove() {
		setCurrentIndex((index) => Math.min(index + 1, moves.length));
	}

	function previousMove() {
		setCurrentIndex((index) => Math.max(index - 1, 0));
	}

	return (
		<div className="rounded-xl border border-white/10 bg-black/40 p-3 text-white">
			<div className="mb-3 flex items-center justify-between">
				<span className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">
					Solution guide
				</span>

				<span className="text-[10px] tabular-nums text-gray-400">
					{currentIndex + 1} / {moves.length}
				</span>
			</div>

			<div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
				<div
					className="h-full rounded-full bg-green-400 transition-all"
					style={{ width: `${progress}%` }}
				/>
			</div>

			<div className="flex flex-col items-center rounded-lg bg-white/5 p-4">
				<span className="text-xs text-gray-400">
					{FACE_NAMES[face]} face
				</span>

				<span className="mt-1 text-5xl font-bold">
					{currentMove}
				</span>

				<div className="my-3 grid w-36 grid-cols-3 gap-1 rounded-lg border border-white/20 bg-white/5 p-1">
					{Array.from({ length: 9 }, (_, index) => (
						<div
							key={index}
							className={`aspect-square rounded-sm ${index === 4
								? "bg-white/50"
								: "bg-white/15"
								}`}
						/>
					))}
				</div>

				<svg
					viewBox="0 0 120 90"
					className="h-20 w-28"
					aria-label={`${direction} rotation`}
				>
					<g
						transform={
							isCounterclockwise
								? "translate(120 0) scale(-1 1)"
								: undefined
						}
					>
						{isHalfTurn ? (
							<>
								<path
									d="M 35 55 A 27 27 0 0 1 83 35"
									fill="none"
									stroke="#4ade80"
									strokeWidth="4"
									strokeLinecap="round"
								/>
								<path
									d="M 75 25 L 85 34 L 72 38"
									fill="none"
									stroke="#4ade80"
									strokeWidth="4"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M 85 55 A 27 27 0 0 1 37 75"
									fill="none"
									stroke="#4ade80"
									strokeWidth="4"
									strokeLinecap="round"
								/>
								<path
									d="M 45 85 L 35 76 L 48 72"
									fill="none"
									stroke="#4ade80"
									strokeWidth="4"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</>
						) : (
							<>
								<path
									d="M 30 65 A 32 32 0 1 1 83 25"
									fill="none"
									stroke="#4ade80"
									strokeWidth="4"
									strokeLinecap="round"
								/>
								<path
									d="M 70 17 L 85 24 L 73 35"
									fill="none"
									stroke="#4ade80"
									strokeWidth="4"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</>
						)}
					</g>
				</svg>

				<p className="mt-1 text-center text-sm font-medium">
					{instruction}
				</p>

				<p className="mt-1 text-center text-[10px] text-gray-400">
					Look directly at the face being turned.
				</p>
			</div>

			<div className="mt-3 flex flex-wrap gap-1">
				{moves.map((move, index) => (
					<span
						key={`${move}-${index}`}
						className={`rounded-md px-2 py-1 font-mono text-[10px] ${index === currentIndex
							? "bg-blue-500 text-white"
							: index < currentIndex
								? "bg-green-500/20 text-green-300"
								: "bg-white/5 text-gray-400"
							}`}
					>
						{move}
					</span>
				))}
			</div>

			<div className="mt-4 grid grid-cols-2 gap-2">
				<button
					onClick={previousMove}
					disabled={currentIndex === 0}
					className="rounded-lg border border-white/15 px-3 py-2 text-xs text-gray-200 transition hover:bg-white/10 disabled:opacity-30"
				>
					Previous
				</button>

				<button
					onClick={nextMove}
					className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-gray-200"
				>
					{currentIndex === moves.length - 1
						? "Finish"
						: "Next move"}
				</button>
			</div>

			<button
				onClick={() => setCurrentIndex(0)}
				className="mt-2 w-full rounded-lg px-3 py-2 text-[10px] text-gray-400 transition hover:bg-white/5 hover:text-white"
			>
				Restart from beginning
			</button>

			{onClose && (
				<button
					onClick={onClose}
					className="mt-1 w-full rounded-lg px-3 py-2 text-[10px] text-gray-400 transition hover:bg-white/5 hover:text-white"
				>
					Close guide
				</button>
			)}
		</div>
	);
}
