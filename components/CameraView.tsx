"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraView() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	async function startCamera() {
		try {
			setError("");
			setLoading(true);

			const mediaSteam = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "environment",
					width: { ideal: 1280 },
					height: { ideal: 720 },
				},
			});

			setStream(mediaSteam);
		} catch (err) {
			console.log(err);
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
	}

	useEffect(() => {
		if (videoRef.current && stream) {
			videoRef.current.srcObject = stream;
		}
	}, [stream]);

	useEffect(() => {
		return () => {
			stream?.getTracks().forEach((track) => track.stop());
		};
	}, [stream]);

	return (
		<div className="w-full space-y-4">
			<div className="relative aspect-video overflow-hidden rounded-xl bg-black">
				{stream ? (
					<>
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							className="h-full w-full object-cover"
						/>

						<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<div className="aspect-square w-[min(70%,420px)] border-2 border-green-400">
								<div className="grid h-full w-full grid-cols-3 grid-rows-3">
									{Array.from({ length: 9 }).map((_, index) => (
										<div
											key={index}
											className="border border-green-400/70"
										/>
									))}
								</div>
							</div>
						</div>

						<div className="absolute left-3 top-3 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
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

			{error && (
				<p className="text-sm text-red-500">{error}</p>
			)}

			<div className="flex justify-center">
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
						className="rounded-lg border border-gray-300 px-6 py-3 font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
					>
						Stop camera
					</button>
				)}
			</div>
		</div>
	);
}