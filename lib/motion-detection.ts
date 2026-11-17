export function calculateMotionRatio(
	current: ImageData,
	previous: ImageData,
	sampleStep = 4,
	excludedArea?: {
		x: number;
		y: number;
		size: number;
	},
	differenceThreshold = 50
): number {
	if (
		current.width !== previous.width ||
		current.height !== previous.height
	) {
		return 1;
	}

	let changedPixels = 0;
	let sampledPixels = 0;

	for (let y = 0; y < current.height; y += sampleStep) {
		for (let x = 0; x < current.width; x += sampleStep) {
			if (
				excludedArea &&
				x >= excludedArea.x &&
				x < excludedArea.x + excludedArea.size &&
				y >= excludedArea.y &&
				y < excludedArea.y + excludedArea.size
			) {
				continue;
			}

			const index = (y * current.width + x) * 4;

			const redDifference = Math.abs(
				current.data[index] - previous.data[index]
			);
			const greenDifference = Math.abs(
				current.data[index + 1] - previous.data[index + 1]
			);
			const blueDifference = Math.abs(
				current.data[index + 2] - previous.data[index + 2]
			);

			const difference =
				(redDifference + greenDifference + blueDifference) / 3;

			if (difference > differenceThreshold) {
				changedPixels++;
			}

			sampledPixels++;
		}
	}

	return sampledPixels > 0
		? changedPixels / sampledPixels
		: 0;
}

export function isNewFace(
	previous: string[] | null,
	current: string[]
): boolean {
	if (!previous || previous.length !== 9 || current.length !== 9) {
		return false;
	}

	const previousCenter = previous[4];
	const currentCenter = current[4];

	return (
		previousCenter !== "unknown" &&
		currentCenter !== "unknown" &&
		previousCenter !== currentCenter
	);
}
