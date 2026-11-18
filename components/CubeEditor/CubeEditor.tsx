"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
	RotateCcw,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

import ColorPalette from "./ColorPalette";

import {
	createEmptyCube,
	paintSticker,
} from "@/lib/cube-state";

import type {
	CubeColor,
	CubeFace,
} from "@/lib/cube-types";

import { validateCube } from "@/lib/cube-validation";

import { cubeToFacelets } from "@/lib/cube-to-facelets";

import { getCubeAtMove } from "@/lib/cube-playback";

const CubeScene = dynamic(
	() => import("./CubeScene"),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full items-center justify-center text-sm text-neutral-500">
				Loading cube...
			</div>
		),
	}
);

export default function CubeEditor() {
	const [cube, setCube] = useState(createEmptyCube);
	const [selectedColor, setSelectedColor] =
		useState<CubeColor>("white");

	const [validation, setValidation] =
		useState<ReturnType<typeof validateCube> | null>(null);

	const [solution, setSolution] = useState<string[] | null>(null);
	const [isSolving, setIsSolving] = useState(false);
	const [solveError, setSolveError] = useState<string | null>(null);

	const [currentMoveIndex, setCurrentMoveIndex] = useState(0);

	const [playbackStates, setPlaybackStates] =
		useState<string[] | null>(null);

	const playbackCube = useMemo(() => {
		if (!solution) {
			return cube;
		}

		if (!playbackStates) {
			return cube;
		}

		return getCubeAtMove(
			cube,
			playbackStates,
			currentMoveIndex
		);
	}, [cube, solution, playbackStates, currentMoveIndex]);

	const filledCount = Object.values(cube)
		.flat()
		.filter((color) => color !== null)
		.length;

	const progress = (filledCount / 54) * 100;

	function handleStickerClick(
		face: CubeFace,
		index: number
	) {
		setCube((currentCube) =>
			paintSticker(
				currentCube,
				face,
				index,
				selectedColor
			)
		);

		setValidation(null);
		setSolution(null);
		setCurrentMoveIndex(0);
		setSolveError(null);
		setPlaybackStates(null);
	}

	function handleReset() {
		setCube(createEmptyCube());
		setValidation(null);
		setSolution(null);
		setCurrentMoveIndex(0);
		setSolveError(null);
		setPlaybackStates(null);
	}

	function handleValidate() {
		setValidation(validateCube(cube));
	}

	async function handleSolve() {
		if (!validation?.valid) {
			return;
		}

		setIsSolving(true);
		setSolveError(null);
		setSolution(null);

		try {
			const facelets = cubeToFacelets(cube);

			const response = await fetch("/api/solve", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ facelets }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error ?? "Failed to solve the cube.");
			}

			setSolution(data.moves);
			setPlaybackStates(data.states);
			setCurrentMoveIndex(0);
		} catch (error) {
			setSolveError(
				error instanceof Error
					? error.message
					: "An unexpected error occurred."
			);
		} finally {
			setIsSolving(false);
		}
	}

	function handlePreviousMove() {
		setCurrentMoveIndex((current) =>
			Math.max(0, current - 1)
		);
	}

	function handleNextMove() {
		setCurrentMoveIndex((current) =>
			Math.min((solution?.length ?? 0) - 1, current + 1)
		);
	}

	function handleRestartSolution() {
		setCurrentMoveIndex(0);
	}

	return (
		<main className="flex min-h-dvh flex-col bg-[#101010] text-white selection:bg-white/20">
			<header className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.07] px-5 sm:px-8">
				<div className="flex items-center gap-3">
					<div className="grid size-8 grid-cols-2 gap-[3px] rounded-md bg-white/[0.08] p-[5px]">
						<span className="rounded-[2px] bg-white" />
						<span className="rounded-[2px] bg-white/40" />
						<span className="rounded-[2px] bg-white/40" />
						<span className="rounded-[2px] bg-white" />
					</div>

					<div>
						<p className="text-sm font-semibold tracking-tight">
							Cube Solver
						</p>
						<p className="text-[10px] tracking-[0.12em] text-neutral-500 uppercase">
							Cube editor
						</p>
					</div>
				</div>

				<button
					type="button"
					onClick={handleReset}
					className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-neutral-400 transition hover:bg-white/[0.06] hover:text-white"
				>
					<RotateCcw size={14} />
					<span className="hidden sm:inline">Reset cube</span>
					<span className="sm:hidden">Reset</span>
				</button>
			</header>

			<div className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
				<section className="relative flex min-h-[440px] flex-col border-b border-white/[0.07] lg:min-h-0 lg:border-r lg:border-b-0">
					<div className="absolute left-6 top-6 z-10">
						<p className="text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
							01 / Workspace
						</p>
						<h1 className="mt-2 text-lg font-medium tracking-tight text-neutral-100">
							Paint your cube
						</h1>
					</div>

					<div className="absolute right-6 top-6 z-10 hidden text-right sm:block">
						<p className="text-[10px] tracking-[0.15em] text-neutral-600 uppercase">
							View controls
						</p>
						<p className="mt-2 text-xs text-neutral-500">
							Drag to rotate · Scroll to zoom
						</p>
					</div>

					<div className="relative min-h-[440px] flex-1 overflow-hidden bg-[radial-gradient(ellipse_at_center,#252525_0%,#171717_48%,#101010_100%)] lg:min-h-[600px]">
						<CubeScene
							cube={playbackCube}
							onStickerClick={handleStickerClick}
						/>

						<div className="pointer-events-none absolute bottom-5 left-0 right-0 text-center">
							<span className="rounded-full border border-white/[0.07] bg-black/20 px-3 py-1.5 text-[10px] tracking-wide text-neutral-500 backdrop-blur-sm">
								DRAG TO ROTATE
							</span>
						</div>
					</div>
				</section>

				<aside className="flex flex-col px-6 py-7 sm:px-8 lg:px-7">
					<div>
						<p className="text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
							02 / Configuration
						</p>

						<h2 className="mt-3 text-xl font-medium tracking-tight">
							Sticker colors
						</h2>

						<p className="mt-2 text-sm leading-relaxed text-neutral-500">
							Choose a color, then select a square on the cube to paint it.
						</p>
					</div>

					<div className="mt-9">
						<div className="mb-4 flex items-center justify-between">
							<span className="text-xs font-medium text-neutral-300">
								Color palette
							</span>
							<span className="text-[10px] text-neutral-600">
								6 COLORS
							</span>
						</div>

						<ColorPalette
							selectedColor={selectedColor}
							onSelectColor={setSelectedColor}
						/>
					</div>

					<div className="mt-9 border-t border-white/[0.07] pt-6">
						<div className="flex items-end justify-between">
							<div>
								<p className="text-xs font-medium text-neutral-300">
									Cube progress
								</p>
								<p className="mt-1 text-xs text-neutral-500">
									Stickers painted
								</p>
							</div>

							<p className="text-lg font-medium tabular-nums">
								{filledCount}
								<span className="text-sm text-neutral-600">
									{" "}/ 54
								</span>
							</p>
						</div>

						<div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.08]">
							<div
								className="h-full rounded-full bg-white transition-[width] duration-300"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>

					<div className="mt-8 border-t border-white/[0.07] pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-medium text-neutral-300">
									Cube validation
								</p>
								<p className="mt-1 text-xs text-neutral-500">
									Check your cube configuration
								</p>
							</div>
						</div>

						<button
							type="button"
							onClick={handleValidate}
							disabled={filledCount !== 54}
							className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-white text-xs font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-neutral-600"
						>
							Validate cube
						</button>

						{validation && (
							<div className="mt-4">
								{validation.valid ? (
									<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
										<p className="text-xs font-medium text-emerald-400">
											Basic validation passed
										</p>
										<p className="mt-1 text-xs leading-relaxed text-neutral-400">
											All stickers and center colors are correctly distributed.
										</p>
									</div>
								) : (
									<div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3">
										<p className="text-xs font-medium text-red-400">
											Validation failed
										</p>

										<ul className="mt-2 space-y-2">
											{validation.errors.map((error) => (
												<li
													key={error}
													className="text-xs leading-relaxed text-neutral-400"
												>
													{error}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
						)}

						{validation?.valid && (
							<button
								type="button"
								onClick={handleSolve}
								disabled={isSolving}
								className="mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-white text-xs font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-wait disabled:opacity-50"
							>
								{isSolving ? "Solving cube..." : "Solve cube"}
							</button>
						)}

						{solveError && (
							<p className="mt-3 text-xs leading-relaxed text-red-400">
								{solveError}
							</p>
						)}


						{solution && (
							<div className="mt-5 border-t border-white/[0.07] pt-5">
								<div className="flex items-center justify-between">
									<p className="text-xs font-medium text-neutral-300">
										Solution
									</p>

									<span className="text-xs tabular-nums text-neutral-500">
										{currentMoveIndex} / {solution.length} completed
									</span>
								</div>

								{solution.length === 0 ? (
									<div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
										<p className="text-xs font-medium text-emerald-400">
											Cube already solved
										</p>
										<p className="mt-1 text-xs text-neutral-400">
											No moves are necessary.
										</p>
									</div>
								) : currentMoveIndex >= solution.length ? (
									<div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
										<p className="text-xs font-medium text-emerald-400">
											Solution completed
										</p>
										<p className="mt-1 text-xs text-neutral-400">
											All moves have been completed.
										</p>
									</div>
								) : (
									<>
										<div className="mt-4 rounded-lg bg-white/[0.05] p-4">
											<p className="text-[10px] tracking-[0.15em] text-neutral-500 uppercase">
												Current move
											</p>

											<p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
												{solution[currentMoveIndex]}
											</p>

											<p className="mt-2 text-xs text-neutral-500">
												Move {currentMoveIndex + 1} of {solution.length}
											</p>
										</div>

										<div className="mt-4 flex gap-2">
											<button
												type="button"
												onClick={handlePreviousMove}
												disabled={currentMoveIndex === 0}
												className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 text-xs text-neutral-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
											>
												<ChevronLeft size={15} />
												Previous
											</button>

											<button
												type="button"
												onClick={handleNextMove}
												className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-black transition hover:bg-neutral-200"
											>
												Next
												<ChevronRight size={15} />
											</button>
										</div>
									</>
								)}

								<div className="mt-4 flex flex-wrap gap-2">
									{solution.map((move, index) => (
										<button
											key={`${move}-${index}`}
											type="button"
											onClick={() => setCurrentMoveIndex(index)}
											className={`rounded-md border px-3 py-2 text-sm font-medium tabular-nums transition ${index === currentMoveIndex
												? "border-white/40 bg-white text-black"
												: index < currentMoveIndex
													? "border-white/10 bg-white/[0.08] text-neutral-500"
													: "border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.08]"
												}`}
										>
											{move}
										</button>
									))}
								</div>

								<button
									type="button"
									onClick={handleRestartSolution}
									disabled={currentMoveIndex === 0}
									className="mt-4 flex items-center gap-2 text-xs text-neutral-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
								>
									<RotateCcw size={13} />
									Restart solution
								</button>
							</div>
						)}

					</div>

					<div className="mt-auto pt-10">
						<div className="flex items-center gap-2 text-xs text-neutral-600">
							<span className="size-1.5 rounded-full bg-emerald-500/70" />
							<span>Changes are saved in this session</span>
						</div>
					</div>
				</aside>
			</div>
		</main>
	);
}
