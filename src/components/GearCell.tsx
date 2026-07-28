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

	const telemetry = useTelemetryStore(
		(state: TelemetryStoreState) => state.telemetry,
	);

	const speedDisplay = useTelemetryStore(
		(state: TelemetryStoreState) => state.speedDisplay,
	);

	const stale = useTelemetryStore((state: TelemetryStoreState) => state.stale);

	const [displayGear, setDisplayGear] = useState("N");
	const [gearPulse, setGearPulse] = useState(false);
	const [highRpm, setHighRpm] = useState(false);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const gearTextRef = useRef<HTMLDivElement | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const isRedStateRef = useRef(false);

	const idleMode = !telemetry;

	useEffect(() => {
		if (idleMode) {
			setDisplayGear("N");
			return;
		}

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
	}, [gearLabel, idleMode]);

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
				setHighRpm(true);
			} else if (rpm < 76) {
				isRedStateRef.current = false;
				setHighRpm(false);
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
		<div className="relative flex h-full w-full items-center justify-center overflow-visible">
			<style>{`
				.fh6-idle-heat {
	background:
		radial-gradient(
			ellipse at 50% 85%,
			rgba(255,90,20,.5) 0%,
			rgba(255,0,55,.32) 32%,
			transparent 62%
		),
		radial-gradient(
			ellipse at 50% 35%,
			rgba(255,0,55,.22) 0%,
			transparent 55%
		),
		radial-gradient(
			circle,
			rgba(255,40,20,.12),
			transparent 72%
		);

	filter:
		blur(30px)
		saturate(1.35);

	opacity:.7;

	animation:
		fh6HeatPulse 4.6s ease-in-out infinite;
}
.fh6-idle-forge {
	background:
		radial-gradient(
			ellipse at 20% 30%,
			rgba(255,120,40,.65) 0%,
			rgba(255,0,55,.35) 22%,
			transparent 55%
		),
		radial-gradient(
			ellipse at 75% 70%,
			rgba(255,40,20,.7) 0%,
			rgba(255,0,55,.25) 25%,
			transparent 60%
		),
		radial-gradient(
			ellipse at 50% 100%,
			rgba(255,180,80,.45),
			transparent 55%
		);

	filter:
		blur(22px)
		saturate(1.5);

	opacity:.55;

	animation:
		fh6ForgeFlow 3.8s ease-in-out infinite;
}
.fh6-idle-shadow {
	background:
		radial-gradient(
			ellipse at center,
			rgba(255,0,55,.42) 0%,
			rgba(255,60,20,.22) 28%,
			rgba(0,0,0,.9) 70%
		);

	filter:
		blur(32px)
		saturate(1.4);

	transform:
		translateY(22%)
		scaleX(1.12);

	opacity:.65;

	animation:
		fh6ShadowBreath 4.8s ease-in-out infinite;
}
.fh6-idle-metal {
	border:1px solid rgba(255,0,55,.18);

	box-shadow:
		0 0 12px rgba(255,0,55,.15),
		inset 0 0 20px rgba(255,60,20,.12);

	animation:
		fh6MetalHeat 5s ease-in-out infinite;
}
.fh6-idle-flame {
	position:absolute;
	width:34%;
	height:55%;
	border-radius:45%;
	background:
		radial-gradient(
			ellipse at center,
			rgba(255,170,80,.45) 0%,
			rgba(255,50,20,.28) 30%,
			rgba(255,0,55,.12) 55%,
			transparent 75%
		);
	filter:blur(22px);
	mix-blend-mode:screen;
	opacity:.45;
}

.fh6-idle-flame.one {
	right:-5%;
	top:5%;
	transform:rotate(35deg);
	animation:fh6FlameOne 3.8s ease-in-out infinite;
}

.fh6-idle-flame.two {
	left:-8%;
	bottom:8%;
	transform:rotate(-35deg);
	animation:fh6FlameTwo 4.6s ease-in-out infinite;
}
.fh6-idle-flame.three {
	left:25%;
	bottom:-10%;
	width:50%;
	height:28%;
	filter:blur(28px);
	animation:fh6FlameThree 3.8s ease-in-out infinite;
}

@keyframes fh6FlameOne {
	0%,100% {
		opacity:.25;
		transform:
			rotate(35deg)
			scale(.85)
			translate(0,0);
	}

	45% {
		opacity:.85;
		transform:
			rotate(20deg)
			scale(1.2)
			translate(-12px,-18px);
	}

	70% {
		opacity:.45;
		transform:
			rotate(45deg)
			scale(.95)
			translate(5px,-5px);
	}
}

@keyframes fh6FlameTwo {
	0%,100% {
		opacity:.35;
		transform:
			rotate(-35deg)
			scale(1);
	}

	50% {
		opacity:.8;
		transform:
			rotate(-15deg)
			scale(1.25)
			translate(18px,-10px);
	}
}

@keyframes fh6FlameThree {
	0%,100% {
		opacity:.3;
		transform:
			scale(.9)
			translateY(0);
	}

	50% {
		opacity:.75;
		transform:
			scale(1.15)
			translateY(-12px);
	}
}
}
@keyframes fh6HeatPulse {
	0%,100% {
		opacity:.55;
		transform:
			scale(.96)
			translateY(4px);
	}

	50% {
		opacity:.95;
		transform:
			scale(1.06)
			translateY(-6px);
	}
}
@keyframes fh6ForgeFlow {
	0%,100% {
		transform:
			scale(.92)
			rotate(-8deg)
			translate(-8px,4px);

		opacity:.35;
	}

	35% {
		transform:
			scale(1.08)
			rotate(8deg)
			translate(10px,-12px);

		opacity:.8;
	}

	65% {
		transform:
			scale(1)
			rotate(-4deg)
			translate(-12px,-5px);

		opacity:.55;
	}
}
@keyframes fh6ShadowBreath {
	0%,100% {
		opacity:.45;
		transform:
			translateY(22%)
			scaleX(1.08);
	}

	50% {
		opacity:.9;
		transform:
			translateY(27%)
			scaleX(1.18);
	}
}
@keyframes fh6MetalHeat {
	0%,100% {
		opacity:.25;
		transform:scale(.985);
	}

	50% {
		opacity:.65;
		transform:scale(1.01);
	}
}

			`}</style>
			<div
				className="relative aspect-square flex items-center justify-center"
				style={{
					width: `min(100%, ${GEAR_MAX_DIAMETER_PX}px)`,
					isolation: "isolate",
				}}
			>
				<canvas
					ref={canvasRef}
					className="absolute inset-0 z-0 h-full w-full pointer-events-none"
				/>

				<div
					aria-hidden="true"
					className="absolute inset-0 z-[5] rounded-full pointer-events-none"
					style={{
						opacity: idleMode ? 1 : 0,
						transform: "translateZ(0)",
						willChange: "opacity,transform",
					}}
				>
					<div className="fh6-idle-shadow absolute inset-x-0 bottom-0 h-1/2 rounded-full" />

					<div className="fh6-idle-heat absolute inset-0 rounded-full" />

					<div className="fh6-idle-forge absolute inset-2 rounded-full" />

					<div className="fh6-idle-metal absolute inset-0 rounded-full" />

					<div className="fh6-idle-flame one" />
					<div className="fh6-idle-flame two" />
					<div className="fh6-idle-flame three" />
				</div>

				<div
					className={`relative z-10 aspect-square flex items-center justify-center rounded-full bg-gradient-to-b from-[#1d1f23] via-[#09090b] to-[#020203] ${idleMode ? "idle-engine-glow" : ""}`}
					style={{
						width: "84.5%",
						containerType: "size",
						transform: "translateZ(0)",
						willChange: "transform",
						boxShadow: idleMode
							? `
	0 0 25px rgba(0,0,0,.75),
	35px 0 65px rgba(0,0,0,.85),
	-35px 0 65px rgba(0,0,0,.85),
	0 45px 90px rgba(0,0,0,.95),
	0 70px 120px rgba(0,0,0,.8),
	0 0 45px rgba(255,0,55,.18),
	inset 0 4px 18px rgba(255,255,255,.08),
	inset 0 -35px 60px rgba(0,0,0,.95)
	`
							: `
	0 5px 8px rgba(0,0,0,.95),
	0 24px 45px rgba(0,0,0,.85),
	0 55px 90px rgba(0,0,0,.75),
	inset 0 4px 18px rgba(255,255,255,.08),
	inset 0 -35px 60px rgba(0,0,0,.95)
	`,
					}}
				>
					<div className="absolute inset-1 rounded-full border border-red-950/50" />

					<div
						className="absolute inset-2 rounded-full opacity-40 pointer-events-none"
						style={{
							background:
								"linear-gradient(135deg,rgba(255,255,255,.15),transparent 30%,transparent 65%,rgba(255,255,255,.03))",
						}}
					/>

					<div className="absolute inset-5 rounded-full border border-black/80" />

					<div className="relative z-20 flex flex-col items-center justify-center">
						<div
							ref={gearTextRef}
							className={`flex items-center justify-center font-mono font-black leading-none transition-transform duration-75 ease-out ${gearPulse ? "scale-[1.1]" : "scale-100"} ${highRpm ? "gear-vibration" : ""}`}
							style={{
								fontSize: "clamp(72px,30cqw,132px)",
								fontWeight: 950,
								fontStyle: "italic",
								letterSpacing: "-0.04em",
								lineHeight: 0.9,

								// 固定幾何中心，不受字寬影響
								width: "1.15em",
								textAlign: "center",

								transform: "translateX(-4px) translateY(4px)",
								paddingInline: 0,

								color: "#e9e9ec",
								filter: "drop-shadow(0 3px 2px rgba(0,0,0,.65))",
							}}
						>
							{displayGear}
						</div>

						<div className="mt-5 flex flex-col items-center gap-y-1">
							<div className="font-mono text-[20px] font-black leading-none tracking-[0.05em] text-zinc-100">
								{formatNumber(speedDisplay, 0)}
							</div>

							<div className="h-[1px] w-12 bg-zinc-700/60" />

							<span className="text-[9px] font-bold tracking-[0.5em] text-zinc-500 racing-text">
								KM/H
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
