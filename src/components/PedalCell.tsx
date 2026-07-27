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
				<div className="flex h-full w-full items-end justify-center gap-0">
					{" "}
					<div className="flex h-full w-[28px] flex-col items-center justify-between">
						{" "}
						<div className="text-[clamp(6px,1.2vw,7px)] font-bold tracking-wider text-zinc-400 racing-text select-none leading-none">
							THR
						</div>
						<div className="relative flex h-[clamp(52px,11vw,64px)] w-[clamp(10px,2.2vw,14px)] items-end bg-[#050508]">
							<div
								className="w-full bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.4)] transition-all duration-75"
								style={{ height: `${clamp(throttle * 100, 0, 100)}%` }}
							/>
						</div>
						<span className="text-[clamp(8px,1.8vw,10px)] font-black text-[#00FF66] racing-text tabular-nums leading-none">
							{formatNumber(throttle * 100, 0)}
						</span>
					</div>
					<div className="flex h-full w-[28px] flex-col items-center justify-between">
						{" "}
						<div className="text-[clamp(6px,1.2vw,7px)] font-bold tracking-wider text-zinc-400 racing-text select-none leading-none">
							BRK
						</div>
						<div className="relative flex h-[clamp(52px,11vw,64px)] w-[clamp(10px,2.2vw,14px)] items-end bg-[#050508]">
							<div
								className="w-full bg-[#FF0055] shadow-[0_0_8px_rgba(255,0,85,0.4)] transition-all duration-75"
								style={{ height: `${clamp(brake * 100, 0, 100)}%` }}
							/>
						</div>
						<span className="text-[clamp(8px,1.8vw,10px)] font-black text-[#FF0055] racing-text tabular-nums leading-none">
							{formatNumber(brake * 100, 0)}
						</span>
					</div>
				</div>

				<div
					className={`mt-[clamp(4px,1vw,8px)] min-h-[1.6rem] rounded-full px-[clamp(6px,1vw,10px)] py-0.5 text-[clamp(6px,1vw,7px)] font-bold tracking-widest racing-text transition-all duration-150 text-center ${
						pedalOverlap
							? "bg-yellow-950/40 text-yellow-500 border border-yellow-500/30"
							: "text-zinc-600"
					}`}
					style={{ whiteSpace: pedalOverlap ? "pre-line" : "nowrap" }}
				>
					{pedalOverlap ? "BRAKE\nOVERLAP" : "NOMINAL"}
				</div>
			</div>
		</div>
	);
}
