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

	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const gearTextRef = useRef<HTMLDivElement | null>(null);
	const isRedStateRef = useRef(false);

	useEffect(() => {
		const invalid =
			gearLabel === "15" || Number(gearLabel) > 10 || gearLabel === "";

		if (!invalid) {
			setDisplayGear(gearLabel);
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		} else {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => {
				setDisplayGear("N");
			}, 100);
		}

		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
			const radius = 216;

			const startAngle = Math.PI * 0.75;
			const totalArc = Math.PI * 1.5;
			const endAngle = startAngle + (rpm / 100) * totalArc;

			ctx.lineCap = "round";

			ctx.lineWidth = 14;
			ctx.strokeStyle = "#050508";
			ctx.beginPath();
			ctx.arc(cx, cy, radius, startAngle, startAngle + totalArc);
			ctx.stroke();

			if (rpm >= 95) {
				isRedStateRef.current = true;
			} else if (rpm < 91) {
				isRedStateRef.current = false;
			}

			let color = "#FFFFFF";
			let isRed = false;

			if (isRedStateRef.current) {
				color = "#FF0055";
				isRed = true;
			} else if (rpm >= 85) {
				color = "#FBBF24";
			}

			if (gearTextRef.current) {
				if (isRed) {
					gearTextRef.current.style.color = "#FF0055";
					gearTextRef.current.classList.add("cyber-glow-red");
				} else {
					gearTextRef.current.style.color = "#F4F4F5";
					gearTextRef.current.classList.remove("cyber-glow-red");
				}
			}

			if (rpm > 0) {
				ctx.lineWidth = 10;
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
			className={`flex h-full w-full items-center justify-center transition-opacity duration-300 ${stale ? "opacity-30" : ""}`}
		>
		<div className="relative flex aspect-square items-center justify-center" style={{ width: `min(95%, ${GEAR_MAX_DIAMETER_PX}px)` }}>
			<div
				className="absolute inset-0 rounded-full border border-[#272a35] bg-gradient-to-b from-[#1b1d24] via-[#050608] to-[#010102]"
				style={{
					boxShadow: shiftOn
						? "0 0 35px rgba(255,0,85,0.55)"
						: "0 18px 35px rgba(0,0,0,0.9)",
				}}
			/>

				<div className="absolute inset-[7%] rounded-full border border-black/90 pointer-events-none" />

				<div
					className="
						relative
						z-20
						flex
						h-full
						w-full
						flex-col
						items-center
						justify-center
						text-center
					"
				>
					<span className="w-full text-center text-[clamp(6px,1.5vw,10px)] font-black tracking-[0.25em] text-zinc-500 racing-text select-none leading-none">
						GEAR
					</span>

					<div
						ref={gearTextRef}
						className="
							relative
							z-20
							mt-[2%]
							w-full
							text-center
							font-mono
							text-[clamp(38px,10vw,82px)]
							font-black
							leading-none
							tracking-tight
							racing-text
							text-zinc-100
							whitespace-nowrap
						"
					>
						{displayGear}
					</div>

					<div className="mt-[2%] flex w-full flex-col items-center justify-center text-center">
						<div className="w-full text-center font-mono text-[clamp(16px,4vw,30px)] font-black text-white racing-text leading-none">
							{formatNumber(speedDisplay, 0)}
						</div>

						<span className="w-full text-center text-[clamp(5px,1vw,8px)] font-bold tracking-widest text-zinc-500 racing-text leading-none">
							KM/H
						</span>
					</div>
				</div>

				<canvas
					ref={canvasRef}
					className="pointer-events-none absolute inset-0 z-0 h-full w-full"
				/>
			</div>
		</div>
	);
}
