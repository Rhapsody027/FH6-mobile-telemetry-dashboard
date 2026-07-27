// src/components/GearCell.tsx
import { useEffect, useRef, useState } from "react";
import { useTelemetryStore, type TelemetryStoreState } from "../useTelemetry";

const GEAR_MAX_DIAMETER_PX = 420;

function formatNumber(value: number, fractionDigits = 0): string {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: fractionDigits,
		minimumFractionDigits: fractionDigits,
	}).format(value);
}

export function GearCell() {
	const gearLabel = useTelemetryStore(
		(state: TelemetryStoreState) => state.gearLabel,
	);

	const speedDisplay = useTelemetryStore(
		(state: TelemetryStoreState) => state.speedDisplay,
	);

	const shiftOn = useTelemetryStore(
		(state: TelemetryStoreState) => state.shiftOn,
	);

	const stale = useTelemetryStore((state: TelemetryStoreState) => state.stale);

	const [displayGear, setDisplayGear] = useState(gearLabel);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const gearTextRef = useRef<HTMLDivElement | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const isRedStateRef = useRef(false);

	useEffect(() => {
		const invalid =
			gearLabel === "" || gearLabel === "15" || Number(gearLabel) > 10;

		if (!invalid) {
			setDisplayGear(gearLabel);

			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		} else {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				setDisplayGear("N");
			}, 100);
		}

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [gearLabel]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const size = 512;

		canvas.width = size;
		canvas.height = size;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let animationId: number;

		const draw = () => {
			ctx.clearRect(0, 0, size, size);

			const rpm = useTelemetryStore.getState().rpmPercent;

			const cx = size / 2;
			const cy = size / 2;

			const radius = 225;

			const startAngle = Math.PI * 0.75;
			const totalArc = Math.PI * 1.5;

			const endAngle = startAngle + (rpm / 100) * totalArc;

			ctx.lineCap = "round";

			ctx.lineWidth = 22;
			ctx.strokeStyle = "#08090d";

			ctx.beginPath();

			ctx.arc(cx, cy, radius, startAngle, startAngle + totalArc);

			ctx.stroke();

			if (rpm >= 80) {
				isRedStateRef.current = true;
			} else if (rpm < 76) {
				isRedStateRef.current = false;
			}

			let color = "#f4f4f5";
			let red = false;

			if (isRedStateRef.current) {
				color = "#ff0055";
				red = true;
			} else if (rpm >= 60) {
				color = "#facc15";
			}

			if (gearTextRef.current) {
				if (red) {
					gearTextRef.current.style.color = "#ff0055";
					gearTextRef.current.classList.add("cyber-glow-red");
				} else {
					gearTextRef.current.style.color = "#f4f4f5";
					gearTextRef.current.classList.remove("cyber-glow-red");
				}
			}

			if (rpm > 0) {
				ctx.lineWidth = 16;
				ctx.strokeStyle = color;

				ctx.beginPath();

				ctx.arc(cx, cy, radius, startAngle, endAngle);

				ctx.stroke();
			}

			animationId = requestAnimationFrame(draw);
		};

		draw();

		return () => {
			cancelAnimationFrame(animationId);
		};
	}, []);

	return (
		<div
			className={`
				relative
				flex
				h-full
				w-full
				items-center
				justify-center
				overflow-visible
				${stale ? "opacity-30" : ""}
			`}
		>
			<div
				className="
					relative
					aspect-square
					flex
					items-center
					justify-center
					overflow-visible
				"
				style={{
					width: `min(100%, ${GEAR_MAX_DIAMETER_PX}px)`,
				}}
			>
				<canvas
					ref={canvasRef}
					className="
						absolute
						inset-0
						z-0
						h-full
						w-full
						pointer-events-none
					"
				/>

				<div
					className="
						relative
						z-10
						aspect-square
						flex
						items-center
						justify-center
						rounded-full
						border
						border-zinc-700/70
						bg-gradient-to-b
						from-[#252832]
						via-[#0c0d12]
						to-[#020203]
					"
					style={{
						width: "82%",
						boxShadow: shiftOn
							? `
							0 0 40px rgba(255,0,85,0.55),
							0 20px 45px rgba(0,0,0,0.95),
							inset 0 2px 8px rgba(255,255,255,0.12),
							inset 0 -20px 30px rgba(0,0,0,0.8)
							`
							: `
							0 22px 50px rgba(0,0,0,0.95),
							inset 0 2px 10px rgba(255,255,255,0.08),
							inset 0 -25px 40px rgba(0,0,0,0.85)
							`,
					}}
				>
					<div
						className="
							absolute
							inset-2
							rounded-full
							border
							border-white/5
						"
					/>

					<div
						className="
							absolute
							inset-5
							rounded-full
							border
							border-zinc-800/70
						"
					/>

					<div
						className="
							relative
							z-20
							flex
							flex-col
							items-center
							justify-center
							gap-y-4
						"
					>
						{/* Gear */}
						<div
							ref={gearTextRef}
							className="
		flex
		items-center
		justify-center
		font-mono
		font-black
		leading-none
		text-zinc-100
		transition-all
		duration-75
	"
							style={{
								fontSize: "clamp(72px,15vw,125px)",
								fontWeight: 950,
								letterSpacing: "-0.03em",
								lineHeight: 1,
								textAlign: "center",
								transform: "translateX(-2px) translateY(2px)",
								textShadow: shiftOn
									? "0 0 18px rgba(255,0,85,0.45)"
									: "0 0 10px rgba(255,255,255,0.15)",
							}}
						>
							{displayGear}
						</div>

						{/* Speed */}
						<div
							className="
								flex
								flex-col
								items-center
								gap-y-1
							"
						>
							<div
								className="
									font-mono
									text-[18px]
									font-black
									tracking-[0.12em]
									text-white
								"
							>
								{formatNumber(speedDisplay, 0)}
							</div>

							<span
								className="
									text-[8px]
									font-bold
									tracking-[0.4em]
									text-zinc-600
									racing-text
								"
							>
								KM/H
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
