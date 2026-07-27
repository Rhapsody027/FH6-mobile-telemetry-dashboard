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
	const [isLandscape, setIsLandscape] = useState(false);

	useEffect(() => {
		const outer = outerRef.current;
		if (!outer) return;

		const recalc = () => {
			const width = outer.clientWidth;
			const height = outer.clientHeight;

			const landscape = width > height;
			setIsLandscape(landscape);

			// HUD 主要設計為直向手機
			if (landscape) {
				setScale(1);
				return;
			}

			// 扣除 safe-area 後計算真正可用空間
			const safeWidth =
				width -
				parseFloat(getComputedStyle(outer).paddingLeft.replace("px", "")) -
				parseFloat(getComputedStyle(outer).paddingRight.replace("px", ""));

			const safeHeight =
				height -
				parseFloat(getComputedStyle(outer).paddingTop.replace("px", "")) -
				parseFloat(getComputedStyle(outer).paddingBottom.replace("px", ""));

			const scaleX = safeWidth / referenceWidth;
			const scaleY = safeHeight / referenceHeight;

			// 保留上下安全空間
			const nextScale = Math.min(scaleX, scaleY);

			setScale(Math.max(nextScale, 0.1));
		};

		recalc();

		const observer = new ResizeObserver(recalc);
		observer.observe(outer);

		window.addEventListener("resize", recalc);
		window.addEventListener("orientationchange", recalc);

		return () => {
			observer.disconnect();
			window.removeEventListener("resize", recalc);
			window.removeEventListener("orientationchange", recalc);
		};
	}, [referenceWidth, referenceHeight]);

	return (
		<div
			ref={outerRef}
			className="relative overflow-hidden bg-black"
			style={{
				width: "100vw",
				height: "100dvh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				boxSizing: "border-box",

				paddingTop: "env(safe-area-inset-top)",
				paddingBottom: "env(safe-area-inset-bottom)",
				paddingLeft: "env(safe-area-inset-left)",
				paddingRight: "env(safe-area-inset-right)",
			}}
		>
			{isLandscape ? (
				<div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs tracking-[0.3em]">
					PORTRAIT MODE ONLY
				</div>
			) : (
				<div
					style={{
						width: referenceWidth,
						height: referenceHeight,
						flexShrink: 0,
						transform: `scale(${scale})`,
						transformOrigin: "center center",
					}}
				>
					{children}
				</div>
			)}
		</div>
	);
}
