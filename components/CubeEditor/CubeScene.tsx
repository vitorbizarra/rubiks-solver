"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import CubeFace from "./CubeFace";

import type {
	CubeFace as CubeFaceType,
	CubeState,
} from "@/lib/cube-types";

const CAMERA_SETTINGS = {
	position: [5, 4, 6] as [number, number, number],
	fov: 40,
};

type CubeSceneProps = {
	cube: CubeState;
	onStickerClick: (face: CubeFaceType, index: number) => void;
};

function CubeModel({
	cube,
	onStickerClick,
}: CubeSceneProps) {
	const faces: CubeFaceType[] = [
		"U",
		"R",
		"F",
		"D",
		"L",
		"B",
	];

	return (
		<group>
			<mesh>
				<boxGeometry args={[3, 3, 3]} />
				<meshStandardMaterial color="#111111" />
			</mesh>

			{faces.map((face) => (
				<CubeFace
					key={face}
					face={face}
					colors={cube[face]}
					onStickerClick={onStickerClick}
				/>
			))}
		</group>
	);
}

export default function CubeScene({
	cube,
	onStickerClick,
}: CubeSceneProps) {
	return (
		<Canvas
			camera={CAMERA_SETTINGS}
			dpr={[1, 2]}
		>
			<color attach="background" args={["#111111"]} />

			<ambientLight intensity={1.8} />

			<directionalLight
				position={[5, 8, 5]}
				intensity={2}
			/>

			<CubeModel
				cube={cube}
				onStickerClick={onStickerClick}
			/>

			<OrbitControls
				enableDamping
				minDistance={4}
				maxDistance={10}
				enablePan={false}
			/>
		</Canvas>
	);
}
