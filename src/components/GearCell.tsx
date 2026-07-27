import { useEffect, useRef, useState } from "react";
import { useTelemetryStore, type TelemetryStoreState } from "../useTelemetry";

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

	const rpmPercent = useTelemetryStore(
		(state: TelemetryStoreState) => state.rpmPercent,
	);

	const [displayGear, setDisplayGear] = useState(gearLabel);

	const lastValidGearRef = useRef(gearLabel);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const gearTextRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const invalid =
			gearLabel === "15" || Number(gearLabel) > 10 || gearLabel === "";

		if (!invalid) {
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

		canvas.width = 180;
		canvas.height = 180;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let frame: number;

		const draw = () => {
			ctx.clearRect(0, 0, 180, 180);

			const cx = 90;
			const cy = 90;
			const radius = 76;

			const start = Math.PI * 0.75;
			const arc = Math.PI * 1.5;

			const rpm = useTelemetryStore.getState().rpmPercent;
			const end = start + (arc * rpm) / 100;

			ctx.lineWidth = 8;
			ctx.lineCap = "round";

			ctx.strokeStyle = "#050508";
			ctx.beginPath();
			ctx.arc(cx, cy, radius, start, start + arc);
			ctx.stroke();

			let color = "#f4f4f5";

			if (rpm >= 95) {
				color = "#FF0055";
			} else if (rpm >= 85) {
				color = "#FBBF24";
			}

			if (rpm > 0) {
				ctx.strokeStyle = color;
				ctx.lineWidth = 7;

				ctx.beginPath();
				ctx.arc(cx, cy, radius, start, end);
				ctx.stroke();
			}

			frame = requestAnimationFrame(draw);
		};

		draw();

		return () => cancelAnimationFrame(frame);
	}, []);

	return (
		<div
			className={`flex h-full w-full items-center justify-center ${
				stale ? "opacity-30" : ""
			}`}
		>
			{/* 
				主角比例調整：
				原本 h-44/w-44
				降低到 h-40/w-40
				避免壓迫周圍 telemetry
			*/}
			<div className="relative h-40 w-40 flex items-center justify-center">
				<div
					className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full border border-[#272a35] bg-gradient-to-b from-[#1b1d24] via-[#050608] to-[#010102]"
					style={{
						boxShadow: shiftOn
							? "0 12px 25px rgba(255,0,85,.35)"
							: "0 12px 22px rgba(0,0,0,.9)",
					}}
				>
					<div className="absolute inset-[6px] rounded-full border border-black/90" />

					<div className="relative z-20 flex h-full w-full flex-col items-center justify-center">
						<span className="text-[8px] font-black tracking-[0.25em] text-zinc-500 racing-text leading-none">
							GEAR
						</span>

						<div
							ref={gearTextRef}
							className="
								mt-1
								font-mono
								text-5xl
								font-black
								leading-none
								racing-text
								text-zinc-100
							"
						>
							{displayGear}
						</div>

						<div className="mt-2 flex flex-col items-center">
							<div
								className="
								font-mono
								text-lg
								font-black
								text-white
								racing-text
								leading-none
							"
							>
								{formatNumber(speedDisplay)}
							</div>

							<span
								className="
								text-[7px]
								font-bold
								tracking-widest
								text-zinc-500
								racing-text
							"
							>
								KM/H
							</span>
						</div>
					</div>
				</div>

				<canvas
					ref={canvasRef}
					className="
						absolute
						inset-0
						h-full
						w-full
						pointer-events-none
						z-0
					"
				/>
			</div>
		</div>
	);
}
