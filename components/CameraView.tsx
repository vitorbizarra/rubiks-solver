"use client";

import { useEffect, useRef, useState } from "react";

import { CubeNet } from "@/components/CubeNet";

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

import {
	calculateMotionRatio,
	isNewFace,
} from "@/lib/motion-detection";

import { FACE_ORDER } from "@/lib/face-capture-guide";

import { useFaceCapture } from "@/hooks/use-face-capture";

export default function CameraView() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sampleAreaRef = useRef<SampleArea | null>(null);
	const motionHistoryRef = useRef<number[]>([]);
	const previousFrameRef = useRef<ImageData | null>(null);
	const lastMotionAtRef = useRef(0);
	const motionActiveRef = useRef(false);
	const lastStableColorsRef = useRef<CubeColor[] | null>(null);
	const previousBackgroundFrameRef = useRef<ImageData | null>(null);
	const motionStartCountRef = useRef(0);

	const [stream, setStream] = useState<MediaStream | null>(null);
	const [colors, setColors] = useState<CubeColor[]>(
		Array(9).fill("unknown")
	);

	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

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

	const [isMoving, setIsMoving] = useState(false);
	const [faceChangeCount, setFaceChangeCount] = useState(0);

	const [motionLevel, setMotionLevel] = useState(0);
	const [isCameraMoving, setIsCameraMoving] = useState(false);

	const identifiedCount = colors.filter(
		(color) => color !== "unknown"
	).length;

	const {
		capturedFaces,
		currentFace,
		currentGuide,
		canCaptureFace,
		cubeValid,
		validationErrors,
		captureFace,
		resetLastFace,
		resetFaceCapture,
	} = useFaceCapture(colors);

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

		motionHistoryRef.current = [];
		previousFrameRef.current = null;
		lastMotionAtRef.current = 0;
		motionActiveRef.current = false;
		lastStableColorsRef.current = null;
		previousBackgroundFrameRef.current = null;
		motionStartCountRef.current = 0;

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

			const motionFrame = context.getImageData(
				Math.floor(left),
				Math.floor(top),
				Math.floor(squareSize),
				Math.floor(squareSize)
			);

			const backgroundFrame = context.getImageData(
				0,
				0,
				width,
				height
			);

			const previousFrame = previousFrameRef.current;
			const previousBackgroundFrame = previousBackgroundFrameRef.current;
			const now = performance.now();

			if (previousFrame && previousBackgroundFrame) {
				const cubeMotion = calculateMotionRatio(
					motionFrame,
					previousFrame,
					2,
					undefined,
					40
				);

				const backgroundMotion = calculateMotionRatio(
					backgroundFrame,
					previousBackgroundFrame,
					8,
					{
						x: left,
						y: top,
						size: squareSize,
					}
				);

				const cameraMoving = backgroundMotion > 0.08;

				setIsCameraMoving(cameraMoving);

				if (cameraMoving) {
					motionHistoryRef.current = [];
					motionActiveRef.current = false;
					lastMotionAtRef.current = now;
					motionStartCountRef.current = 0;

					setIsMoving(false);
					lastStableColorsRef.current = detectedColors;
					setMotionLevel(
						Math.min(100, Math.round(backgroundMotion * 200))
					);
				} else {
					motionHistoryRef.current.push(cubeMotion);

					if (motionHistoryRef.current.length > 5) {
						motionHistoryRef.current.shift();
					}

					const motionRatio =
						motionHistoryRef.current.reduce(
							(total, value) => total + value,
							0
						) / motionHistoryRef.current.length;

					setMotionLevel(
						Math.min(100, Math.round(motionRatio * 200))
					);

					if (motionRatio > 0.10) {
						motionStartCountRef.current++;
						lastMotionAtRef.current = now;

						if (
							!motionActiveRef.current &&
							motionStartCountRef.current >= 2
						) {
							motionActiveRef.current = true;
							setIsMoving(true);
						}
					} else {
						motionStartCountRef.current = 0;

						if (
							motionActiveRef.current &&
							now - lastMotionAtRef.current > 800 &&
							motionRatio < 0.04
						) {
							motionActiveRef.current = false;
							setIsMoving(false);

							if (
								isNewFace(
									lastStableColorsRef.current,
									detectedColors
								)
							) {
								setFaceChangeCount((count) => count + 1);
							}

							lastStableColorsRef.current = detectedColors;
						} else if (!motionActiveRef.current) {
							lastStableColorsRef.current = detectedColors;
						}
					}
				}
			} else {
				lastStableColorsRef.current = detectedColors;
				setIsCameraMoving(false);
			}

			previousFrameRef.current = motionFrame;
			previousBackgroundFrameRef.current = backgroundFrame;

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
						<span
							className={`h-2 w-2 rounded-full ${isCameraMoving
								? "bg-amber-300"
								: isMoving
									? "bg-red-300"
									: "bg-green-300 animate-pulse"}`}
						/>
						<span className="text-xs font-medium text-white">
							{isCameraMoving
								? "Camera moving"
								: isMoving
									? "Cube moving"
									: "Stable"}
						</span>
					</div>

					<div className="absolute left-4 top-16 w-36 rounded-xl border border-white/10 bg-black/65 p-3 backdrop-blur-md">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-[10px] font-medium uppercase tracking-wider text-gray-300">
								Motion
							</span>

							<span className="text-[10px] tabular-nums text-gray-400">
								{motionLevel}%
							</span>
						</div>

						<div className="h-1.5 overflow-hidden rounded-full bg-white/10">
							<div
								className={`h-full rounded-full transition-all duration-150 ${motionLevel >= 50
									? "bg-red-400"
									: motionLevel >= 25
										? "bg-amber-400"
										: "bg-green-400"
									}`}
								style={{ width: `${motionLevel}%` }}
							/>
						</div>
					</div>

					<div className="absolute right-4 top-4 w-64 rounded-xl border border-white/10 bg-black/75 p-3 shadow-2xl backdrop-blur-md sm:right-6 sm:top-6 sm:w-72">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">
								Cube scanner
							</span>

							<span className="text-[10px] tabular-nums text-gray-400">
								{identifiedCount}/9
							</span>
						</div>

						<div className="mt-1 text-[10px] text-gray-400">
							Face changes: {faceChangeCount}
						</div>

						{currentGuide && (
							<div className="mb-3">
								<div className="mb-1 flex items-center justify-between">
									<span className="text-xs font-semibold text-white">
										{currentGuide.title}
									</span>

									<span className="text-xs font-medium text-blue-400">
										{currentFace}
									</span>
								</div>

								<p className="text-[11px] leading-relaxed text-gray-200">
									{currentGuide.instruction}
								</p>

								<p className="mt-1 text-[10px] leading-relaxed text-gray-400">
									{currentGuide.orientation}
								</p>
							</div>
						)}

						<CubeNet
							capturedFaces={capturedFaces}
							currentFace={currentFace}
							liveColors={colors}
						/>

						{capturedFaces.length === 6 && (
							<div
								className={`mt-3 rounded-lg border p-3 ${cubeValid
										? "border-green-500/30 bg-green-500/10"
										: "border-red-500/30 bg-red-500/10"
									}`}
							>
								<div className="flex items-center gap-2">
									<span
										className={`h-2 w-2 rounded-full ${cubeValid ? "bg-green-400" : "bg-red-400"
											}`}
									/>
									<span
										className={`text-xs font-semibold ${cubeValid ? "text-green-300" : "text-red-300"
											}`}
									>
										{cubeValid
											? "Basic validation passed"
											: "Cube validation failed"}
									</span>
								</div>

								{!cubeValid && (
									<ul className="mt-2 space-y-1">
										{validationErrors.map((error) => (
											<li
												key={error}
												className="text-[10px] text-red-200"
											>
												{error}
											</li>
										))}
									</ul>
								)}
							</div>
						)}

						<div className="mt-4 border-t border-white/10 pt-3">
							<div className="mb-3 flex items-center justify-between">
								<span className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">
									Face capture
								</span>

								<span className="text-xs tabular-nums text-gray-400">
									{capturedFaces.length}/6
								</span>
							</div>

							<div className="mb-3 flex gap-1">
								{FACE_ORDER.map((face, index) => (
									<div
										key={face}
										className={`flex h-7 flex-1 items-center justify-center rounded-md text-xs font-semibold ${index < capturedFaces.length
											? "bg-green-500/30 text-green-300"
											: index === capturedFaces.length
												? "border border-white/40 bg-white/15 text-white"
												: "bg-white/5 text-gray-500"
											}`}
									>
										{face}
									</div>
								))}
							</div>

							{capturedFaces.length < 6 ? (
								<>
									<p className="mb-3 text-xs text-gray-300">
										Waiting for all 9 colors to be recognized.
									</p>

									<div className="mb-3 flex flex-wrap gap-2">
										<button
											onClick={captureFace}
											disabled={!canCaptureFace}
											className="w-full rounded-lg bg-white px-3 py-2.5 text-xs font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
										>
											Capture {currentFace}
										</button>

										<button
											onClick={resetLastFace}
											disabled={capturedFaces.length === 0}
											className="w-full rounded-lg border border-white/20 px-3 py-2 text-xs text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
										>
											Reset last face
										</button>
									</div>
								</>
							) : (
								<div className="space-y-2">
									<p className={`text-xs font-semibold ${cubeValid ? "text-green-300" : "text-red-300"}`}>
										{cubeValid
											? "Cube data validated"
											: "Cube data needs correction"}
									</p>

									<button
										onClick={resetFaceCapture}
										className="w-full rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 transition hover:bg-white/10"
									>
										Reset capture
									</button>
								</div>
							)}
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
