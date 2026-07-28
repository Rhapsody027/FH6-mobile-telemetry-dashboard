// src/components/PedalCell.tsx
import { useTelemetryStore, type TelemetryStoreState } from "../useTelemetry";

function formatNumber(value: number, fractionDigits = 0): string {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: fractionDigits,
		minimumFractionDigits: fractionDigits,
	}).format(value);
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function PedalCell() {
	const telemetry = useTelemetryStore(
		(state: TelemetryStoreState) => state.telemetry,
	);

	const pedalOverlap = useTelemetryStore(
		(state: TelemetryStoreState) => state.pedalOverlap,
	);

	const throttle = telemetry?.throttle ?? 0;
	const brake = telemetry?.brake ?? 0;

	return (
		<div className="relative flex h-full w-full items-center justify-center rounded-[20px] bg-black/20 p-[clamp(4px,1.2vw,10px)] backdrop-blur-[1px]">
			<div className="flex h-full w-full max-w-[180px] flex-col items-center justify-center">
				<div className="flex h-full w-full items-center justify-center gap-x-0">
					{/* THR */}
					<div className="flex h-full w-[34px] flex-col items-center justify-center">
						<div className="mb-1 text-[clamp(7px,1.4vw,9px)] font-black tracking-[0.18em] text-zinc-300 racing-text">
							THR
						</div>

						<div className="relative h-[clamp(52px,11vw,64px)] w-[clamp(12px,2.5vw,16px)] overflow-hidden border border-white/10 bg-[#050508]">
							<div
								className="absolute bottom-0 left-0 w-full bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.4)] transition-all duration-75"
								style={{
									height: `${clamp(throttle * 100, 0, 100)}%`,
								}}
							/>
						</div>

						<div className="mt-1 min-w-[36px] text-center text-[clamp(11px,2.2vw,14px)] font-black text-[#00FF66] racing-text tabular-nums">
							{formatNumber(throttle * 100, 0)}
						</div>
					</div>

					{/* BRK */}
					<div className="flex h-full w-[34px] flex-col items-center justify-center">
						<div className="mb-1 text-[clamp(7px,1.4vw,9px)] font-black tracking-[0.18em] text-zinc-300 racing-text">
							BRK
						</div>

						<div className="relative h-[clamp(52px,11vw,64px)] w-[clamp(12px,2.5vw,16px)] overflow-hidden border border-white/10 bg-[#050508]">
							<div
								className="absolute bottom-0 left-0 w-full bg-[#FF0055] shadow-[0_0_8px_rgba(255,0,85,0.4)] transition-all duration-75"
								style={{
									height: `${clamp(brake * 100, 0, 100)}%`,
								}}
							/>
						</div>

						<div className="mt-1 min-w-[36px] text-center text-[clamp(11px,2.2vw,14px)] font-black text-[#FF0055] racing-text tabular-nums">
							{formatNumber(brake * 100, 0)}
						</div>
					</div>
				</div>

				<div
					className={`
					mt-2
					flex
					h-[18px]
					min-w-[76px]
					items-center
					justify-center
					border-t
					text-[clamp(7px,1.1vw,8px)]
					font-black
					tracking-[0.35em]
					racing-text
					transition-all
					duration-150

					${
						pedalOverlap
							? `
								border-yellow-400/60
								bg-yellow-500/10
								text-yellow-300
								`
							: `
								border-zinc-800
								text-zinc-600
								`
					}
				`}
				>
					{pedalOverlap ? "OVERLAP" : "NOMINAL"}
				</div>
			</div>
		</div>
	);
}
