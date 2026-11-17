
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
		className: "bg-gray-500",
	},
};

function rgbToHsv(r: number, g: number, b: number) {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;

	let h = 0;

	if (delta !== 0) {
		if (max === r) {
			h = 60 * (((g - b) / delta) % 6);
		} else if (max === g) {
			h = 60 * ((b - r) / delta + 2);
		} else {
			h = 60 * ((r - g) / delta + 4);
		}
	}

	if (h < 0) h += 360;

	const s = max === 0 ? 0 : (delta / max) * 100;
	const v = max * 100;

	return { h, s, v };
}


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

		if (saturation < 0.20 && brightness > 0.60) {
			votes.white++;
			continue;
		}

		if (saturation < 0.30) continue;

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
				"Failed to access the camera. Please check your permissions and try again."
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
		const height = 360;

		canvas.width = width;
		canvas.height = height;

		const interval = window.setInterval(() => {
			if (video.readyState < 2) return;

			context.drawImage(video, 0, 0, width, height);

			const squareSize = width * 0.48;

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

					const color = identifyColor(
						context,
						x,
						y,
						sampleSize
					);

					detectedColors.push(color);
				}
			}

			setColors(detectedColors);
		}, 150);

		return () => window.clearInterval(interval);
	}, [stream]);

	const identifiedCount = colors.filter(
		(color) => color !== "unknown"
	).length;

	return (
		<div className="w-full space-y-6">
			<div className="relative aspect-video overflow-hidden rounded-xl bg-black">
				{stream ? (
					<>
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							className="h-full w-full object-cover"
							style={{
								transform: mirrored ? "scaleX(-1)" : "none",
							}}
						/>

						<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<div className="aspect-square w-[min(48%,420px)] border-2 border-green-400">
								<div className="grid h-full w-full grid-cols-3 grid-rows-3">
									{colors.map((color, index) => (
										<div
											key={index}
											className={`border border-green-400/70 ${color !== "unknown"
												? "bg-black/10"
												: ""
												}`}
										/>
									))}
								</div>
							</div>
						</div>

						<div className="absolute left-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
							Active camera
						</div>
					</>
				) : (
					<div className="flex h-full flex-col items-center justify-center gap-3 text-white">
						<span className="text-4xl">📷</span>

						<p className="text-sm text-gray-300">
							The camera has not been started yet
						</p>
					</div>
				)}
			</div>

			<canvas
				ref={canvasRef}
				className="hidden"
			/>

			<div className="rounded-xl border border-gray-700 p-5">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="font-semibold">
						Colors identified
					</h3>

					<span className="text-sm text-gray-400">
						{identifiedCount}/9
					</span>
				</div>

				<div className="mx-auto grid max-w-[240px] grid-cols-3 gap-2">
					{colors.map((color, index) => (
						<div
							key={index}
							title={COLOR_INFO[color].label}
							className={`aspect-square rounded-lg border border-gray-600 ${COLOR_INFO[color].className}`}
						/>
					))}
				</div>

				<div className="mt-4 flex flex-wrap justify-center gap-3">
					{Object.entries(COLOR_INFO)
						.filter(([color]) => color !== "unknown")
						.map(([color, info]) => (
							<div
								key={color}
								className="flex items-center gap-2 text-xs text-gray-400"
							>
								<span
									className={`h-3 w-3 rounded-full ${info.className}`}
								/>

								{info.label}
							</div>
						))}
				</div>
			</div>

			{error && (
				<p className="text-sm text-red-500">{error}</p>
			)}

			<div className="flex justify-center gap-2">
				{!stream ? (
					<button
						onClick={startCamera}
						disabled={loading}
						className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
					>
						{loading ? "Starting camera..." : "Start camera"}
					</button>
				) : (
					<button
						onClick={stopCamera}
						className="rounded-lg border border-gray-600 px-6 py-3 font-medium transition hover:bg-gray-800"
					>
						Stop camera
					</button>
				)}

				<button
					onClick={() => setMirrored((current) => !current)}
					className="rounded-lg border border-gray-600 px-5 py-3 font-medium transition hover:bg-gray-800"
				>
					{mirrored ? "Disable mirroring" : "Mirror webcam"}
				</button>
			</div>
		</div>
	);
}
