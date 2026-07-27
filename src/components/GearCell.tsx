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

		ctx.setTransform(1, 0, 0, 1, 0, 0);

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

			ctx.lineWidth = 20;
			ctx.strokeStyle = "#090a0f";

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
				ctx.lineWidth = 15;
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
						border-zinc-700/80
						bg-gradient-to-b
						from-[#1d2028]
						via-[#07080c]
						to-[#010102]
					"
					style={{
						width: "81.5%",
						boxShadow: shiftOn
							? "0 0 35px rgba(255,0,85,0.5), inset 0 0 25px rgba(255,0,85,0.15)"
							: "0 18px 35px rgba(0,0,0,0.95), inset 0 0 20px rgba(255,255,255,0.04)",
					}}
				>
					<div
						className="
							absolute
							inset-2
							rounded-full
							border
							border-black/90
						"
					/>

					<div
						className="
							absolute
							inset-4
							rounded-full
							border
							border-zinc-800/50
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
							gap-y-3
						"
					>
						<span
							className="
								text-[8px]
								font-black
								tracking-[0.45em]
								text-zinc-500
								racing-text
							"
						>
							GEAR
						</span>
						<div className="overflow-visible px-[6px]">
							<div
								ref={gearTextRef}
								className="
			font-mono
			text-[60px]
			font-black
			leading-none
			whitespace-nowrap
			overflow-visible
			text-zinc-100
			transition-all
			duration-75
		"
								style={{
									fontStyle: "italic",
									letterSpacing: "-0.06em",
									paddingRight: "0.08em",
									paddingLeft: "0.02em",
								}}
							>
								{displayGear}
							</div>
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
									text-[15px]
									font-black
									tracking-[0.08em]
									text-zinc-300
									racing-text
								"
							>
								{formatNumber(speedDisplay, 0)}
							</div>

							<span
								className="
									text-[8px]
									font-bold
									tracking-[0.35em]
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
