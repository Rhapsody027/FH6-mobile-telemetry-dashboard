import { useMemo, useState } from "react";
import type { TelemetryStoreState } from "../useTelemetry";
import { buildWebSocketUrl, useTelemetryStore } from "../useTelemetry";

export function InsightCell({ telemetry }: { telemetry: TelemetryStoreState }) {
	const [showIpPanel, setShowIpPanel] = useState(false);
	const [inputIp, setInputIp] = useState(telemetry.hubIp);

	const initWebSocket = useTelemetryStore((state) => state.initWebSocket);

	const setHubIp = useTelemetryStore((state) => state.setHubIp);

	const wsTarget = useMemo(
		() => buildWebSocketUrl(telemetry.hubIp),
		[telemetry.hubIp],
	);

	const pairState = telemetry.connected
		? "CONNECTED"
		: telemetry.stale
			? "STANDBY"
			: "SEARCHING";

	const connectManualIp = () => {
		const target = inputIp.trim();

		if (!target) return;

		setHubIp(target);
		initWebSocket(target);
		setShowIpPanel(false);
	};

	return (
		<div className="relative flex h-full w-full select-none items-stretch justify-center py-1">
			<div className="flex h-full w-full flex-col justify-center gap-2 rounded-[20px] bg-zinc-950/85 px-3 py-3 shadow-[0_0_18px_rgba(0,0,0,0.35)] backdrop-blur-[2px]">
				<div className="flex items-center justify-between gap-2">
					<div>
						<div className="text-[7px] font-black tracking-[0.25em] text-zinc-400 uppercase leading-none">
							QR PAIRING
						</div>
					</div>

					<div
						className={`rounded-full px-2 py-1 text-[7px] font-black tracking-[0.22em] uppercase ${
							pairState === "CONNECTED"
								? "bg-green-950/30 text-green-300"
								: "bg-yellow-950/30 text-yellow-300"
						}`}
					>
						{pairState}
					</div>
				</div>

				<div className="flex items-center justify-between pt-1">
					<div className="flex items-center gap-2">
						<div
							className={`h-1.5 w-1.5 rounded-full ${
								telemetry.connected
									? "bg-green-400 shadow-[0_0_8px_rgba(0,255,100,0.8)]"
									: "bg-red-500 shadow-[0_0_8px_rgba(255,0,85,0.65)]"
							}`}
						/>

						<div className="text-[6px] leading-3 tracking-[0.14em] text-zinc-500 uppercase">
							SCAN HUB QR
						</div>
					</div>

					<button
						onClick={() => setShowIpPanel(true)}
						className="rounded-full border border-zinc-700 bg-black/60 px-2 py-1 text-[6px] font-black tracking-[0.15em] text-zinc-400"
					>
						MANUAL IP
					</button>
				</div>
			</div>

			{showIpPanel && (
				<div className="absolute inset-0 z-50 flex items-center justify-center">
					<div
						className="absolute inset-0 rounded-[20px] bg-black/80"
						onClick={() => setShowIpPanel(false)}
					/>

					<div className="relative z-10 flex w-[90%] flex-col gap-3 rounded-[18px] border border-zinc-700 bg-zinc-950 p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
						<div className="text-[9px] font-black tracking-[0.25em] text-zinc-400">
							HUB IP ADDRESS
						</div>

						<input
							value={inputIp}
							onChange={(e) => setInputIp(e.target.value)}
							placeholder="192.168.1.xxx"
							className="h-8 rounded-lg border border-zinc-700 bg-black px-3 text-[10px] font-mono text-white outline-none"
						/>

						<div className="flex gap-2">
							<button
								onClick={connectManualIp}
								className="flex-1 rounded-full bg-green-950/50 py-2 text-[8px] font-black tracking-[0.2em] text-green-300"
							>
								CONNECT
							</button>

							<button
								onClick={() => setShowIpPanel(false)}
								className="flex-1 rounded-full bg-zinc-900 py-2 text-[8px] font-black tracking-[0.2em] text-zinc-400"
							>
								CANCEL
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
