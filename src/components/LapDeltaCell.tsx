import { useTelemetryStore, type TelemetryStoreState } from "../useTelemetry";

function formatNumber(value: number, fractionDigits = 0): string {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: fractionDigits,
		minimumFractionDigits: fractionDigits,
	}).format(value);
}

function formatSigned(value: number, fractionDigits = 2): string {
	return `${value >= 0 ? "+" : ""}${formatNumber(value, fractionDigits)}`;
}

export function LapDeltaCell() {
	const telemetry = useTelemetryStore(
		(state: TelemetryStoreState) => state.telemetry,
	);

	const stale = useTelemetryStore((state: TelemetryStoreState) => state.stale);

	const delta = telemetry?.lapDelta;

	const getDeltaColorClass = () => {
		if (delta === null || delta === undefined || delta === 0) {
			return stale ? "text-zinc-700" : "text-zinc-400";
		}

		return delta > 0 ? "text-red-500 cyber-glow-red" : "text-[#00FF66]";
	};

	return (
		<div
			className="
				flex
				h-full
				w-full
				items-center
				justify-center
				rounded-[18px]
				bg-black/10
				backdrop-blur-[1px]
				px-2
			"
		>
			<div
				className="
					flex
					flex-col
					items-center
					justify-center
					text-center
				"
			>
				<span
					className="
						text-[clamp(6px,1vw,8px)]
						font-black
						tracking-[0.2em]
						text-zinc-600
						racing-text
						leading-none
					"
				>
					LAP DELTA
				</span>

				<span
					className={`
						mt-2
						font-mono
						text-[clamp(20px,4vw,30px)]
						font-black
						leading-none
						tracking-tight
						tabular-nums
						racing-text
						transition-colors
						duration-150
						${getDeltaColorClass()}
					`}
				>
					{delta === null || delta === undefined
						? "0.00"
						: `${formatSigned(delta, 2)}s`}
				</span>
			</div>
		</div>
	);
}
