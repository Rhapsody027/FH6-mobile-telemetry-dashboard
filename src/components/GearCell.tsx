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
	const lastValidGearRef = useRef(gearLabel);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const isRedStateRef = useRef(false);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const gearTextRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const isInvalid =
			gearLabel === "15" || Number(gearLabel) > 10 || gearLabel === "";
		if (!isInvalid) {
			lastValidGearRef.current = gearLabel;
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

		const drawLoop = () => {
			ctx.clearRect(0, 0, size, size);

			const currentRpm = useTelemetryStore.getState().rpmPercent;
			const cx = size / 2;
			const cy = size / 2;
			const radius = 216;

			const startAngle = 0.75 * Math.PI;
			const totalArc = 1.5 * Math.PI;
			const endAngle = startAngle + (currentRpm / 100) * totalArc;

			ctx.lineWidth = 14;
			ctx.lineCap = "round";
			ctx.strokeStyle = "#050508";
			ctx.beginPath();
			ctx.arc(cx, cy, radius, startAngle, startAngle + totalArc);
			ctx.stroke();

			if (currentRpm >= 80) {
				isRedStateRef.current = true;
			} else if (currentRpm < 76) {
				isRedStateRef.current = false;
			}

			let color = "#FFFFFF";
			let isRed = false;

			if (isRedStateRef.current) {
				color = "#FF0055";
				isRed = true;
			} else if (currentRpm >= 60) {
				color = "#FBBF24";
			}

			if (gearTextRef.current) {
				if (isRed) {
					gearTextRef.current.style.color = "#FF0055";
					gearTextRef.current.classList.add("cyber-glow-red", "scale-105");
				} else {
					gearTextRef.current.style.color = "#F4F4F5";
					gearTextRef.current.classList.remove("cyber-glow-red", "scale-105");
				}
			}

			if (currentRpm > 0) {
				ctx.lineWidth = 10;
				ctx.strokeStyle = color;
				ctx.beginPath();
				ctx.arc(cx, cy, radius, startAngle, endAngle);
				ctx.stroke();
			}

			animationId = requestAnimationFrame(drawLoop);
		};

		drawLoop();
		return () => cancelAnimationFrame(animationId);
	}, []);

	return (
		<div
			className={`relative flex h-full w-full items-center justify-center transition-all duration-300 ${stale ? "opacity-30" : ""}`}
		>
			<div
				className="relative flex aspect-square items-center justify-center"
				style={{ width: `min(95%, ${GEAR_MAX_DIAMETER_PX}px)` }}
			>
				{/* Canvas 在底層，不干擾文字 */}
				<canvas
					ref={canvasRef}
					className="absolute inset-0 h-full w-full aspect-square pointer-events-none z-0"
				/>

				{/* 正圓形現代紅黑金屬硬裝甲 */}
				<div
					className="relative aspect-square rounded-full flex flex-col items-center justify-center bg-gradient-to-b from-[#1b1d24] via-[#050608] to-[#010102] border border-[#272a35] z-10"
					style={{
						width: "82%",
						boxShadow: shiftOn
							? "0 16px 30px rgba(255, 0, 85, 0.35), 0 4px 10px rgba(0,0,0,0.8)"
							: "0 18px 25px rgba(0, 0, 0, 0.95), 0 3px 6px rgba(0,0,0,0.5)",
					}}
				>
					<div className="absolute inset-1 aspect-square rounded-full border border-black/90 pointer-events-none" />

					<div className="z-10 flex flex-col items-center justify-center gap-y-1 px-3">
						<span className="text-[10px] font-black tracking-[0.25em] text-zinc-500 racing-text select-none leading-none">
							GEAR
						</span>

						<div
							ref={gearTextRef}
							className="font-mono text-4xl font-black leading-none transition-all duration-75 racing-text text-zinc-100"
						>
							{displayGear}
						</div>

						<div className="flex flex-col items-center justify-center leading-none gap-y-0.5">
							<div className="font-mono text-base font-black tracking-tight text-white racing-text">
								{formatNumber(speedDisplay, 0)}
							</div>
							<span className="text-[10px] font-bold tracking-widest text-zinc-500 racing-text select-none leading-none">
								KM/H
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
