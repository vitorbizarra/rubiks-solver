"use client";

import { useEffect, useRef, useState } from "react";

import {
	CALIBRATION_COLORS,
	COLOR_INFO,
	DEFAULT_CALIBRATION,
	type CalibrationSettings,
	type CalibratableColor,
	type CubeColor,
	type SampleArea,
} from "@/lib/color-types";

import {
	getRingSamples,
	identifyColor,
} from "@/lib/color-detection";

import {
	calibrateColor,
	loadCalibration,
	saveCalibration,
	resetCalibration as getDefaultCalibration,
} from "@/lib/color-calibration";

export default function CameraView() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sampleAreaRef = useRef<SampleArea | null>(null);

	const [stream, setStream] = useState<MediaStream | null>(null);
	const [colors, setColors] = useState<CubeColor[]>(
		Array(9).fill("unknown")
	);

	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [mirrored, setMirrored] = useState(true);

	const [calibration, setCalibration] =
		useState<CalibrationSettings>(() =>
			typeof window === "undefined"
				? DEFAULT_CALIBRATION
				: loadCalibration()
		);

	const [calibrationOpen, setCalibrationOpen] = useState(false);
	const [selectedColor, setSelectedColor] =
		useState<CalibratableColor>("red");
	const [calibrationMessage, setCalibrationMessage] = useState("");

	const identifiedCount = colors.filter(
		(color) => color !== "unknown"
	).length;

	useEffect(() => {
		saveCalibration(calibration);
	}, [calibration]);

	async function startCamera() {
		try {
			setError("");
			setLoading(true);

			const mediaStream =
				await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: "environment",
						width: { ideal: 1280 },
						height: { ideal: 720 },
					},
					audio: false,
				});

			setStream(mediaStream);
		} catch (err) {
			console.error(err);
			setError(
				"Failed to access the camera. Check your permissions."
			);
		} finally {
			setLoading(false);
		}
	}

	function stopCamera() {
		stream?.getTracks().forEach((track) => track.stop());
		setStream(null);
		setColors(Array(9).fill("unknown"));
	}

	function captureCalibration() {
		const canvas = canvasRef.current;
		const area = sampleAreaRef.current;

		if (!canvas || !area) {
			setCalibrationMessage("Camera is not ready yet.");
			return;
		}

		const context = canvas.getContext("2d", {
			willReadFrequently: true,
		});

		if (!context) return;

		const samples = getRingSamples(context, area);

		const result = calibrateColor(
			calibration,
			selectedColor,
			samples
		);

		if (result.calibration) {
			setCalibration(result.calibration);
		}

		setCalibrationMessage(result.message);
	}

	function resetCalibration() {
		setCalibration(getDefaultCalibration());
		setCalibrationMessage("Default calibration restored.");
	}

	useEffect(() => {
		if (!videoRef.current || !stream) return;

		videoRef.current.srcObject = stream;
		videoRef.current.play().catch(console.error);
	}, [stream]);

	useEffect(() => {
		return () => {
			stream?.getTracks().forEach((track) => track.stop());
		};
	}, [stream]);

	useEffect(() => {
		if (!stream) return;

		const video = videoRef.current;
		const canvas = canvasRef.current;

		if (!video || !canvas) return;

		const context = canvas.getContext("2d", {
			willReadFrequently: true,
		});

		if (!context) return;

		const width = 640;

		const scanFrame = () => {
			if (
				video.readyState < 2 ||
				!video.videoWidth ||
				!video.videoHeight
			) {
				return;
			}

			const height = Math.round(
				width * (window.innerHeight / window.innerWidth)
			);

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
			}

			const targetRatio = width / height;
			const sourceRatio = video.videoWidth / video.videoHeight;

			let sourceX = 0;
			let sourceY = 0;
			let sourceWidth = video.videoWidth;
			let sourceHeight = video.videoHeight;

			if (sourceRatio > targetRatio) {
				sourceWidth = video.videoHeight * targetRatio;
				sourceX = (video.videoWidth - sourceWidth) / 2;
			} else {
				sourceHeight = video.videoWidth / targetRatio;
				sourceY = (video.videoHeight - sourceHeight) / 2;
			}

			context.drawImage(
				video,
				sourceX,
				sourceY,
				sourceWidth,
				sourceHeight,
				0,
				0,
				width,
				height
			);

			const squareSize = Math.min(
				width * 0.20,
				height * 0.50
			);

			const left = (width - squareSize) / 2;
			const top = (height - squareSize) / 2;

			const cellSize = squareSize / 3;
			const sampleSize = cellSize * 0.92;

			const detectedColors: CubeColor[] = [];

			for (let row = 0; row < 3; row++) {
				for (let col = 0; col < 3; col++) {
					const area: SampleArea = {
						x:
							left +
							col * cellSize +
							(cellSize - sampleSize) / 2,
						y:
							top +
							row * cellSize +
							(cellSize - sampleSize) / 2,
						size: sampleSize,
					};

					if (row === 1 && col === 1) {
						sampleAreaRef.current = area;
					}

					detectedColors.push(
						identifyColor(context, area, calibration)
					);
				}
			}

			setColors(detectedColors);
		};

		const interval = window.setInterval(scanFrame, 120);

		scanFrame();

		return () => window.clearInterval(interval);
	}, [stream, calibration]);

	return (
		<div className="fixed inset-0 overflow-hidden bg-black">
			{stream ? (
				<>
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className="absolute inset-0 h-full w-full object-cover"
						style={{
							transform: mirrored ? "scaleX(-1)" : "none",
						}}
					/>

					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<div className="aspect-square w-[min(20vw,50vh)] border border-green-400/80">
							<div className="grid h-full w-full grid-cols-3 grid-rows-3">
								{colors.map((color, index) => (
									<div
										key={index}
										className="border border-green-400/50"
									/>
								))}
							</div>
						</div>
					</div>

					<div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-md">
						<span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
						<span className="text-xs font-medium text-white">
							Live
						</span>
					</div>

					<div className="absolute right-4 top-4 w-28 rounded-xl border border-white/10 bg-black/65 p-2 shadow-2xl backdrop-blur-md sm:right-6 sm:top-6 sm:w-36">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">
								Colors
							</span>

							<span className="text-[10px] tabular-nums text-gray-400">
								{identifiedCount}/9
							</span>
						</div>

						<div
							className="grid grid-cols-3 gap-1"
							style={{
								transform: mirrored ? "scaleX(-1)" : "none",
							}}
						>
							{colors.map((color, index) => (
								<div
									key={index}
									title={COLOR_INFO[color].label}
									className={`aspect-square rounded-sm border border-white/10 ${COLOR_INFO[color].className}`}
								/>
							))}
						</div>
					</div>

					<div className="absolute bottom-4 left-4 flex items-center gap-2 sm:bottom-6 sm:left-6">
						<button
							onClick={stopCamera}
							className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-black/65 px-4 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/85"
						>
							<span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
							Stop
						</button>

						<button
							onClick={() => setMirrored((current) => !current)}
							title="Toggle mirroring"
							className={`flex h-11 w-11 items-center justify-center text-white rounded-full border backdrop-blur-md transition ${mirrored
								? "border-green-400/50 bg-green-500/30 hover:bg-green-500/40"
								: "border-white/10 bg-black/65 hover:bg-black/85"
								}`}
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.7"
								className="h-5 w-5"
							>
								<path d="M12 3v18M5 7l-3 5 3 5M19 7l3 5-3 5" />
								<path d="M7 5H5v14h2M17 5h2v14h-2" />
							</svg>
						</button>
					</div>

					<div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
						{calibrationOpen ? (
							<div className="w-64 rounded-xl border border-white/10 bg-black/85 p-4 text-white shadow-2xl backdrop-blur-xl">
								<div className="mb-4 flex items-center justify-between">
									<span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
										Color calibration
									</span>

									<button
										onClick={() => {
											setCalibrationOpen(false);
											setCalibrationMessage("");
										}}
										className="text-gray-400 transition hover:text-white"
									>
										✕
									</button>
								</div>

								<p className="mb-3 text-xs leading-relaxed text-gray-400">
									Place a sticker of the selected color in the center square, then capture a sample.
								</p>

								<div className="grid grid-cols-3 gap-2">
									{CALIBRATION_COLORS.map((color) => (
										<button
											key={color}
											onClick={() => {
												setSelectedColor(color);
												setCalibrationMessage("");
											}}
											className={`flex items-center gap-2 rounded-lg border p-2 text-xs transition ${selectedColor === color
												? "border-white/70 bg-white/15"
												: "border-white/10 bg-white/5 hover:bg-white/10"
												}`}
										>
											<span
												className={`h-4 w-4 rounded-sm ${COLOR_INFO[color].className}`}
											/>
											{COLOR_INFO[color].label}
										</button>
									))}
								</div>

								<button
									onClick={captureCalibration}
									className="mt-4 w-full rounded-lg bg-white px-3 py-2.5 text-xs font-semibold text-black transition hover:bg-gray-200"
								>
									Capture sample
								</button>

								<button
									onClick={resetCalibration}
									className="mt-2 w-full rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 transition hover:bg-white/10"
								>
									Restore defaults
								</button>

								{calibrationMessage && (
									<p className="mt-3 text-xs text-gray-300">
										{calibrationMessage}
									</p>
								)}
							</div>
						) : (
							<button
								onClick={() => setCalibrationOpen(true)}
								className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-black/65 px-4 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/85"
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.7"
									className="h-5 w-5"
								>
									<path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
									<circle cx="12" cy="12" r="5" />
									<circle cx="12" cy="12" r="1.5" />
								</svg>
								Calibrate
							</button>
						)}
					</div>
				</>
			) : (
				<div className="flex h-full w-full items-center justify-center">
					<div className="flex flex-col items-center gap-5">
						<div className="grid grid-cols-2 gap-2">
							<span className="h-8 w-8 rounded-sm bg-white" />
							<span className="h-8 w-8 rounded-sm bg-red-500" />
							<span className="h-8 w-8 rounded-sm bg-blue-500" />
							<span className="h-8 w-8 rounded-sm bg-yellow-400" />
						</div>

						<button
							onClick={startCamera}
							disabled={loading}
							className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:opacity-50"
						>
							{loading ? "Starting camera..." : "Start camera"}
						</button>

						{error && (
							<p className="max-w-sm text-center text-sm text-red-400">
								{error}
							</p>
						)}
					</div>
				</div>
			)}

			{stream && error && (
				<div className="absolute bottom-20 left-4 rounded-lg border border-red-500/20 bg-black/80 px-4 py-3 text-sm text-red-400 backdrop-blur-md">
					{error}
				</div>
			)}

			<canvas ref={canvasRef} className="hidden" />
		</div>
	);
}
