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
			}, 150);

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

			// RPM base ring
			ctx.lineWidth = 22;
			ctx.strokeStyle = "#08090d";

			ctx.beginPath();
			ctx.arc(cx, cy, radius, startAngle, startAngle + totalArc);
			ctx.stroke();

			// RPM state
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
				gearTextRef.current.style.color = red ? "#ff0055" : "#e9e9ec";

				gearTextRef.current.style.textShadow = red
					? `
						0 0 4px rgba(255,0,85,.9),
						0 0 14px rgba(255,0,85,.55),
						0 0 30px rgba(255,0,85,.25)
					`
					: `
						0 1px 1px rgba(0,0,0,.9),
						0 -1px 0 rgba(255,255,255,.18),
						0 0 6px rgba(255,255,255,.08)
					`;
			}

			if (rpm > 0) {
				ctx.lineWidth = 18;
				ctx.strokeStyle = color;

				ctx.beginPath();

				ctx.arc(cx, cy, radius, startAngle, endAngle);

				ctx.stroke();
			}

			animationId = requestAnimationFrame(draw);
		};

		draw();

		return () => cancelAnimationFrame(animationId);
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
						from-[#202126]
						via-[#09090b]
						to-[#020203]
					"
					style={{
						width: "84.5%",
						boxShadow: `
							0 22px 50px rgba(0,0,0,0.95),
							inset 0 3px 15px rgba(255,255,255,0.08),
							inset 0 -30px 55px rgba(0,0,0,0.9),
							inset 0 0 35px rgba(0,0,0,0.35)
						`,
					}}
				>
					{/* CNC red edge */}
					<div
						className="
							absolute
							inset-1
							rounded-full
							border
							border-red-950/60
						"
					/>

					{/* Curved glass reflection */}
					<div
						className="
							absolute
							inset-2
							rounded-full
							opacity-40
							pointer-events-none
						"
						style={{
							background:
								"linear-gradient(135deg,rgba(255,255,255,0.12),transparent 35%,transparent 65%,rgba(255,255,255,0.04))",
						}}
					/>

					{/* Inner mechanical layer */}
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
						"
					>
						{/* Gear */}
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
								duration-75
								ease-out
								${gearPulse ? "scale-[1.1]" : "scale-100"}
							`}
							style={{
								fontSize: "clamp(78px,16vw,132px)",
								fontWeight: 950,
								fontStyle: "italic",
								letterSpacing: "-0.055em",
								lineHeight: 0.9,
								transform: "translateX(-6px) translateY(4px)",
								paddingInline: "10px",
								color: "#e9e9ec",
								textShadow: `
	0 1px 1px rgba(0,0,0,.9),
	0 -1px 0 rgba(255,255,255,.18),
	0 0 6px rgba(255,255,255,.08)
`,
								filter: "drop-shadow(0 3px 2px rgba(0,0,0,.65))",
							}}
						>
							{displayGear}
						</div>

						{/* Speed */}
						<div
							className="
								mt-5
								flex
								flex-col
								items-center
								gap-y-1
							"
						>
							<div
								className="
									font-mono
									text-[20px]
									font-black
									leading-none
									tracking-[0.05em]
									text-zinc-100
								"
								style={{
									textShadow: "0 0 8px rgba(255,255,255,.15)",
								}}
							>
								{formatNumber(speedDisplay, 0)}
							</div>

							<div
								className="
									h-[1px]
									w-12
									bg-zinc-700/60
								"
							/>

							<span
								className="
									text-[9px]
									font-bold
									tracking-[0.5em]
									text-zinc-500
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
