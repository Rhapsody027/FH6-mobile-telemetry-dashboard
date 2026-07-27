import { useEffect } from "react";

export function useKeepAwake() {
	useEffect(() => {
		const enable = async () => {
			const capacitor = (window as any).Capacitor;

			if (!capacitor) return;

			const KeepAwake = capacitor.Plugins.KeepAwake;

			if (!KeepAwake) {
				console.warn("[KeepAwake] Plugin missing");
				return;
			}

			try {
				await KeepAwake.keepAwake();
				console.log("[KeepAwake] enabled");
			} catch (err) {
				console.error("[KeepAwake] failed", err);
			}
		};

		enable();

		return () => {
			const capacitor = (window as any).Capacitor;
			const KeepAwake = capacitor?.Plugins?.KeepAwake;

			if (KeepAwake) {
				void KeepAwake.allowSleep();
			}
		};
	}, []);
}
