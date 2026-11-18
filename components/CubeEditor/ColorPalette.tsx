
import { Check } from "lucide-react";

import {
	CUBE_COLORS,
	type CubeColor,
} from "@/lib/cube-types";

type ColorPaletteProps = {
	selectedColor: CubeColor;
	onSelectColor: (color: CubeColor) => void;
};

export default function ColorPalette({
	selectedColor,
	onSelectColor,
}: ColorPaletteProps) {
	return (
		<div className="grid grid-cols-2 gap-2">
			{CUBE_COLORS.map((color) => {
				const selected = selectedColor === color.id;

				return (
					<button
						key={color.id}
						type="button"
						aria-label={color.label}
						aria-pressed={selected}
						onClick={() => onSelectColor(color.id)}
						className={`flex h-12 items-center gap-3 rounded-lg border px-3 text-left transition ${selected
								? "border-white/30 bg-white/[0.08]"
								: "border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
							}`}
					>
						<span
							className="flex size-5 shrink-0 items-center justify-center rounded-full border border-black/20"
							style={{
								backgroundColor: color.hex,
							}}
						>
							{selected && (
								<Check
									size={12}
									className="text-black"
								/>
							)}
						</span>

						<span className="text-xs font-medium text-neutral-300">
							{color.label}
						</span>
					</button>
				);
			})}
		</div>
	);
}
