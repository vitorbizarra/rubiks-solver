
"use client";

import { useEffect, useRef, useState } from "react";

type CubeColor =
	| "white"
	| "yellow"
	| "red"
	| "orange"
	| "green"
	| "blue"
	| "unknown";

const COLOR_INFO: Record<
	CubeColor,
	{ label: string; className: string }
> = {
	white: {
		label: "White",
		className: "bg-white",
	},
	yellow: {
		label: "Yellow",
		className: "bg-yellow-400",
	},
	red: {
		label: "Red",
		className: "bg-red-600",
	},
	orange: {
		label: "Orange",
		className: "bg-orange-500",
	},
	green: {
		label: "Green",
		className: "bg-green-600",
	},
	blue: {
		label: "Blue",
		className: "bg-blue-600",
	},
	unknown: {
		label: "Unknown",
		className: "bg-gray-600",
	},
};

function identifyColor(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number
): CubeColor {
	const image = context.getImageData(
		Math.round(x),
		Math.round(y),
		Math.max(1, Math.round(size)),
		Math.max(1, Math.round(size))
	);

	const pixels = image.data;

	const votes: Record<string, number> = {
		white: 0,
		yellow: 0,
		orange: 0,
		red: 0,
		green: 0,
		blue: 0,
	};

	for (let i = 0; i < pixels.length; i += 4) {
		const r = pixels[i] / 255;
		const g = pixels[i + 1] / 255;
		const b = pixels[i + 2] / 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const delta = max - min;

		const saturation = max === 0 ? 0 : delta / max;
		const brightness = max;

		if (brightness < 0.15) continue;

		if (saturation < 0.2 && brightness > 0.6) {
			votes.white++;
			continue;
		}

		if (saturation < 0.3) continue;

		let hue = 0;

		if (delta !== 0) {
			if (max === r) {
				hue = 60 * (((g - b) / delta) % 6);
			} else if (max === g) {
				hue = 60 * ((b - r) / delta + 2);
			} else {
				hue = 60 * ((r - g) / delta + 4);
			}
		}

		if (hue < 0) hue += 360;

		if (hue < 12 || hue >= 345) {
			votes.red++;
		} else if (hue < 38) {
			votes.orange++;
		} else if (hue < 72) {
			votes.yellow++;
		} else if (hue < 165) {
			votes.green++;
		} else if (hue < 260) {
			votes.blue++;
		}
	}

	const bestColor = Object.entries(votes).reduce(
		(best, current) =>
			current[1] > best[1] ? current : best,
		["unknown", 0] as [string, number]
	);

	if (bestColor[1] < 3) return "unknown";

	return bestColor[0] as CubeColor;
}

export default function CameraView() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [stream, setStream] = useState<MediaStream | null>(null);
	const [colors, setColors] = useState<CubeColor[]>(
		Array(9).fill("unknown")
	);

	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [mirrored, setMirrored] = useState(true);

	const identifiedCount = colors.filter(
		(color) => color !== "unknown"
	).length;

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

			canvas.width = width;
			canvas.height = height;

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
				width * 0.48,
				height * 0.85
			);

			const left = (width - squareSize) / 2;
			const top = (height - squareSize) / 2;

			const cellSize = squareSize / 3;
			const sampleSize = cellSize * 0.35;

			const detectedColors: CubeColor[] = [];

			for (let row = 0; row < 3; row++) {
				for (let col = 0; col < 3; col++) {
					const x =
						left +
						col * cellSize +
						(cellSize - sampleSize) / 2;

					const y =
						top +
						row * cellSize +
						(cellSize - sampleSize) / 2;

					detectedColors.push(
						identifyColor(context, x, y, sampleSize)
					);
				}
			}

			setColors(detectedColors);
		};

		const interval = window.setInterval(scanFrame, 150);

		scanFrame();

		return () => window.clearInterval(interval);
	}, [stream]);

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
						<div className="aspect-square w-[min(48vw,85vh)] border border-green-400/80">
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

						<div className="grid grid-cols-3 gap-1">
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
							className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/65 text-white backdrop-blur-md transition hover:bg-black/85"
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
