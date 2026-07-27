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
	const [gearPulse, setGearPulse] = useState(false);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const gearTextRef = useRef<HTMLDivElement | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const isRedStateRef = useRef(false);

	useEffect(() => {
		const invalid =
			gearLabel === "" || gearLabel === "15" || Number(gearLabel) > 10;

		if (!invalid) {
			setDisplayGear(gearLabel);

			setGearPulse(true);

			const timer = setTimeout(() => {
				setGearPulse(false);
			}, 120);

			return () => clearTimeout(timer);
		}

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			setDisplayGear("N");
		}, 100);

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
				gearTextRef.current.style.color = red ? "#ff0055" : "#f4f4f5";

				gearTextRef.current.style.textShadow = red
					? "0 0 6px rgba(255,0,85,0.8), 0 0 18px rgba(255,0,85,0.45)"
					: "0 0 8px rgba(255,255,255,0.12)";
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
						bg-gradient-to-b
						from-[#1c1d22]
						via-[#09090b]
						to-[#020203]
					"
					style={{
						width: "82.5%",
						boxShadow: shiftOn
							? `
							0 20px 50px rgba(0,0,0,0.95),
							inset 0 3px 12px rgba(255,255,255,0.12),
							inset 0 -25px 45px rgba(0,0,0,0.9),
							0 0 0 2px rgba(120,0,25,0.35)
							`
							: `
							0 22px 50px rgba(0,0,0,0.95),
							inset 0 3px 12px rgba(255,255,255,0.08),
							inset 0 -25px 45px rgba(0,0,0,0.85)
							`,
					}}
				>
					{/* JDM 紅色切削點綴 */}
					<div
						className="
							absolute
							inset-1
							rounded-full
							border
							border-red-950/60
						"
					/>

					{/* 金屬反光層 */}
					<div
						className="
							absolute
							inset-2
							rounded-full
							border
							border-white/5
						"
					/>

					{/* 內部機械陰影 */}
					<div
						className="
							absolute
							inset-5
							rounded-full
							border
							border-black/80
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
						<div
							ref={gearTextRef}
							className={`
								flex
								items-center
								justify-center
								font-mono
								font-black
								leading-none
								transition-transform
								duration-100
								${gearPulse ? "scale-110" : "scale-100"}
							`}
							style={{
								fontSize: "clamp(72px,15vw,125px)",
								fontWeight: 950,
								fontStyle: "italic",
								letterSpacing: "-0.035em",
								lineHeight: 1,
								transform: "translateX(-5px) translateY(1px)",
								textShadow: "0 0 8px rgba(255,255,255,0.12)",
							}}
						>
							{displayGear}
						</div>

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
