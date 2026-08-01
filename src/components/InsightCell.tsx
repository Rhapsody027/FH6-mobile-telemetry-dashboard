// src/components/InsightCell.tsx
import { useEffect, useState } from "react";
import type { TelemetryStoreState } from "../useTelemetry";
import { useTelemetryStore } from "../useTelemetry";

export function InsightCell({ telemetry }: { telemetry: TelemetryStoreState }) {
	const [ipInput, setIpInput] = useState(telemetry.hubIp);
	const [isEditing, setIsEditing] = useState(false);

	useEffect(() => {
		if (!isEditing) {
			setIpInput(telemetry.hubIp);
		}
	}, [telemetry.hubIp, isEditing]);

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
		<div
			className="
				grid
				w-full
				max-w-[150px]
				grid-cols-[minmax(0,1fr)_20px]
				grid-rows-[20px_1px_24px]
				items-center
				gap-x-2
				gap-y-2
				overflow-hidden
				px-3
				py-2
			"
		>
			<div
				className="
					min-w-0
					overflow-hidden
					whitespace-nowrap
					text-ellipsis
					racing-text
					text-[8px]
					font-bold
					tracking-[0.25em]
					text-zinc-500
				"
			>
				FH6 Dashboard
			</div>

			<div
				className={`
					justify-self-center
					h-1.5
					w-1.5
					rounded-full
					${
						pairState === "CONNECTED"
							? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]"
							: pairState === "STANDBY"
								? "bg-yellow-400"
								: "bg-zinc-600"
					}
				`}
				title={pairState}
			/>

			<div className="col-span-2 h-px bg-zinc-800" />

			<input
				value={ipInput}
				onChange={(e) => setIpInput(e.target.value)}
				onFocus={() => setIsEditing(true)}
				onBlur={() => setIsEditing(false)}
				placeholder="192.168.x.x"
				inputMode="decimal"
				className={`
					h-6
					min-w-0
					rounded-sm
					bg-[#050507]
					px-2
					font-mono
					text-[9px]
					tracking-[0.05em]
					text-zinc-300
					outline-none
					placeholder:text-zinc-700
					transition-all
					duration-150

					border
					${
						isEditing
							? "border-zinc-600 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9),0_0_8px_rgba(255,255,255,0.08)]"
							: "border-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)]"
					}

					${isEditing ? "w-[130px]" : "w-full"}
				`}
			/>

			<button
				onClick={handleConnect}
				className="
					flex
					h-6
					w-5
					items-center
					justify-center
					text-zinc-600
					transition
					active:scale-95
					hover:text-zinc-300
				"
			>
				<span
					className="
						flex
						w-5
						justify-center
						text-[10px]
					"
				>
					{pairState === "CONNECTED" ? "↻" : "GO"}
				</span>
			</button>
		</div>
	);
}
