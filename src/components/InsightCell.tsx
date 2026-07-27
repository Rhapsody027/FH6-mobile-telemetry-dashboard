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
		<div className="flex h-full w-full select-none items-stretch justify-center py-1">
			<div
				className="
					flex
					h-full
					w-full
					flex-col
					justify-center
					gap-2
					rounded-[20px]
					bg-zinc-950/85
					px-3
					py-3
					shadow-[0_0_18px_rgba(0,0,0,0.35)]
					backdrop-blur-sm
				"
			>
				<div className="flex items-center justify-between">
					<div
						className="
							text-[7px]
							font-black
							tracking-[0.25em]
							text-zinc-400
							racing-text
						"
					>
						HUB LINK
					</div>

					<div
						className={`
							rounded-full
							px-2
							py-1
							text-[7px]
							font-black
							tracking-[0.2em]
							racing-text
							${
								pairState === "CONNECTED"
									? "bg-green-950/40 text-green-300"
									: "bg-yellow-950/40 text-yellow-400"
							}
						`}
					>
						{pairState}
					</div>
				</div>

				{/* IP 輸入框佔滿一行 */}
				<div className="flex gap-2">
					<input
						value={ipInput}
						onChange={(e) => setIpInput(e.target.value)}
						placeholder="192.168.x.x"
						inputMode="decimal"
						className="
							min-w-0
							flex-1
							rounded-lg
							border
							border-zinc-700
							bg-black/50
							px-3
							py-2
							font-mono
							text-[3px]
							text-zinc-200
							outline-none
							placeholder:text-zinc-600
							focus:border-red-500/50
							tracking-[0.1em]
							overflow-x-auto
							whitespace-nowrap
						"
					/>
				</div>

				{/* 按鈕放置在下方 */}
				<div className="flex justify-end pt-1">
					<button
						onClick={handleConnect}
						className="
							rounded-lg
							border
							border-zinc-700
							bg-gradient-to-b
							from-zinc-800
							to-zinc-900
							px-4
							py-1.5
							text-[7px]
							font-black
							tracking-widest
							text-zinc-300
							racing-text
							active:scale-95
							shadow-[0_2px_4px_rgba(0,0,0,0.3)]
							hover:from-zinc-700
							hover:to-zinc-800
							w-fit
						"
					>
						LINK
					</button>
				</div>

				{/* 移除了 ws://... 顯示區域 */}
			</div>
		</div>
	);
}
