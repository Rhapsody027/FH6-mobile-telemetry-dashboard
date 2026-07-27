// src/components/InsightCell.tsx
import { useMemo, useState } from "react";
import type { TelemetryStoreState } from "../useTelemetry";
import { buildWebSocketUrl, useTelemetryStore } from "../useTelemetry";

export function InsightCell({ telemetry }: { telemetry: TelemetryStoreState }) {
	const wsTarget = useMemo(
		() => buildWebSocketUrl(telemetry.hubIp),
		[telemetry.hubIp],
	);

	const [ipInput, setIpInput] = useState(telemetry.hubIp);

	const setHubIp = useTelemetryStore((state) => state.setHubIp);

	const initWebSocket = useTelemetryStore((state) => state.initWebSocket);

	const pairState = telemetry.connected
		? "CONNECTED"
		: telemetry.stale
			? "STANDBY"
			: "SEARCHING";

	const handleConnect = () => {
		const target = ipInput.trim();

		if (!target) return;

		setHubIp(target);
		initWebSocket(target);
	};
	return (
		<div className="flex h-full w-full select-none items-center justify-center">
			<div
				className="
				flex
				w-full
				flex-col
				gap-2
				border
				border-zinc-800
				bg-zinc-950/80
				px-3
				py-2
			"
			>
				{/* Header */}
				<div className="flex items-center justify-between">
					<div
						className="
						racing-text
						text-[8px]
						font-bold
						tracking-[0.3em]
						text-zinc-500
					"
					>
						HUB LINK
					</div>

					<div
						className={`
						border
						px-2
						py-[2px]
						text-[7px]
						font-bold
						tracking-[0.2em]
						racing-text
						
					`}
					>
						{pairState}
					</div>
				</div>

				<div className="h-px bg-zinc-800" />

				{/* IP */}
				<div className="flex gap-2">
					<input
						value={ipInput}
						onChange={(e) => setIpInput(e.target.value)}
						placeholder="192.168.x.x"
						inputMode="decimal"
						className="
						min-w-0
						flex-1
						border
						border-zinc-800
						bg-black
						px-2
						py-1.5
						font-mono
						text-[9px]
						text-zinc-300
						outline-none
						placeholder:text-zinc-700
						focus:border-red-600
					"
					/>

					<button
						onClick={handleConnect}
						className="
						border
						border-red-900
						bg-red-950/30
						px-3
						text-[8px]
						font-bold
						tracking-[0.25em]
						text-red-400
						transition
						hover:border-red-600
						hover:text-red-300
						active:scale-95
					"
					>
						LINK
					</button>
				</div>
			</div>
		</div>
	);
}
