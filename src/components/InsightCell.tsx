// src/components/InsightCell.tsx
import { useMemo, useState } from "react";
import type { TelemetryStoreState } from "../useTelemetry";
import { buildWebSocketUrl, useTelemetryStore } from "../useTelemetry";

type InsightCellProps = {
	telemetry: TelemetryStoreState;
};

export function InsightCell({ telemetry }: InsightCellProps) {
	const wsTarget = useMemo(
		() => buildWebSocketUrl(telemetry.hubIp),
		[telemetry.hubIp],
	);

	const [manualIp, setManualIp] = useState(telemetry.hubIp);

	const pairState = telemetry.connected
		? "CONNECTED"
		: telemetry.stale
			? "STANDBY"
			: "SEARCHING";

	const connectManual = () => {
		const target = manualIp.trim();
		if (!target) return;

		const store = useTelemetryStore.getState();
		store.setHubIp(target);
		store.closeWebSocket();
		store.initWebSocket(target);
	};

	return (
		<div className="flex h-full w-full select-none items-stretch justify-center py-1">
			<div className="flex h-full w-full flex-col justify-center gap-2 rounded-[20px] bg-zinc-950/85 px-3 py-3 shadow-[0_0_18px_rgba(0,0,0,0.35)] backdrop-blur-[1px]">
				<div className="flex items-center justify-between gap-2">
					<div className="min-w-0">
						<div className="text-[7px] font-black tracking-[0.25em] text-zinc-400 uppercase leading-none">
							QR PAIRING
						</div>
					</div>

					<div
						className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-black tracking-[0.22em] uppercase ${
							pairState === "CONNECTED"
								? "bg-green-950/20 text-green-300"
								: "bg-yellow-950/20 text-yellow-300"
						}`}
					>
						{pairState}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(255,0,85,0.65)]" />

					<div className="text-[6px] leading-3 tracking-[0.14em] text-zinc-500 uppercase">
						SCAN QR OR INPUT IP
					</div>
				</div>

				<div className="flex gap-2 pt-1">
					<input
						value={manualIp}
						onChange={(e) => setManualIp(e.target.value)}
						placeholder="192.168.x.x"
						className="min-w-0 flex-1 rounded-full border border-zinc-800 bg-black/50 px-3 py-1 text-[8px] font-mono text-zinc-300 outline-none placeholder:text-zinc-700"
					/>

					<button
						onClick={connectManual}
						className="rounded-full bg-zinc-800 px-3 py-1 text-[7px] font-black tracking-widest text-zinc-200 active:scale-95"
					>
						CONNECT
					</button>
				</div>

				<div className="hidden text-[6px] text-zinc-700">{wsTarget}</div>
			</div>
		</div>
	);
}
