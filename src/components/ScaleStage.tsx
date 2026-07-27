import { useEffect, useRef, useState, type ReactNode } from "react";

type ScaleStageProps = {
	children: ReactNode;
	referenceWidth: number;
	referenceHeight: number;
};

export function ScaleStage({
	children,
	referenceWidth,
	referenceHeight,
}: ScaleStageProps) {
	const outerRef = useRef<HTMLDivElement | null>(null);
	const [scale, setScale] = useState(1);

	useEffect(() => {
		const outer = outerRef.current;
		if (!outer) return;

		const recalc = () => {
			const viewportWidth = window.visualViewport?.width ?? window.innerWidth;

			const viewportHeight =
				window.visualViewport?.height ?? window.innerHeight;

			const safeWidth = viewportWidth;
			const safeHeight = viewportHeight;

			const scaleX = safeWidth / referenceWidth;
			const scaleY = safeHeight / referenceHeight;

			const nextScale = Math.min(scaleX, scaleY);

			setScale(nextScale);
		};

		recalc();

		const observer = new ResizeObserver(recalc);
		observer.observe(outer);

		window.visualViewport?.addEventListener("resize", recalc);
		window.addEventListener("resize", recalc);
		window.addEventListener("orientationchange", recalc);

		return () => {
			observer.disconnect();

			window.visualViewport?.removeEventListener("resize", recalc);

			window.removeEventListener("resize", recalc);
			window.removeEventListener("orientationchange", recalc);
		};
	}, [referenceWidth, referenceHeight]);

	return (
		<div
			ref={outerRef}
			className="h-[100dvh] w-screen overflow-hidden bg-black flex items-center justify-center"
			style={{
				paddingTop: "env(safe-area-inset-top)",
				paddingBottom: "env(safe-area-inset-bottom)",
				paddingLeft: "env(safe-area-inset-left)",
				paddingRight: "env(safe-area-inset-right)",
			}}
		>
			<div
				style={{
					width: referenceWidth,
					height: referenceHeight,
					transform: `scale(${scale})`,
					transformOrigin: "center center",
					flexShrink: 0,
				}}
			>
				{children}
			</div>
		</div>
	);
}
