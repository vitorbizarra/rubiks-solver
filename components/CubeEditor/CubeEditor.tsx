"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { RotateCcw } from "lucide-react";

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
	}

	function handleReset() {
		setCube(createEmptyCube());
		setValidation(null);
	}

	function handleValidate() {
		setValidation(validateCube(cube));
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
							cube={cube}
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
