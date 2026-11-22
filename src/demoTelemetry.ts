// src/demoTelemetry.ts
//
// Offline demo source: synthesizes telemetry frames with the exact shape the
// FH6 Hub decoder (fh6-hub/decoder.py) broadcasts over WebSocket, so the
// dashboard can be shown without the game, the Hub, or a network.
//
// Enable with `?demo` in the URL, or build with `VITE_DEMO=true`.
// `?demo=<seconds>` jumps into the lap (e.g. `?demo=9` = braking zone).
//
// One simulated lap ≈ 16 s and loops seamlessly:
//   straight (upshifts) → lift → threshold braking (ABS) → trail-brake turn-in → exit (wheelspin)
// Corner direction alternates every lap.

import type { BackendTelemetryData, Quad } from "./useTelemetry";

const LAP_SECONDS = 16;
const RPM_IDLE = 1200;
const RPM_MAX = 8000;
const RPM_REDLINE = 7850;
// Top speed (km/h) of each gear at redline; index = gear number.
const GEAR_TOP_KMH = [0, 62, 98, 132, 164, 196, 232];

export function isDemoRequested(): boolean {
	if (import.meta.env.VITE_DEMO === "true") return true;
	try {
		return new URLSearchParams(window.location.search).has("demo");
	} catch {
		return false;
	}
}

/** `?demo=12.5` starts the simulated lap 12.5 s in (handy for screenshots). */
export function demoStartOffsetSeconds(): number {
	try {
		const value = Number(new URLSearchParams(window.location.search).get("demo"));
		return Number.isFinite(value) && value > 0 ? value : 0;
	} catch {
		return 0;
	}
}

const lerp =(a: number, b: number, p: number) => a + (b - a) * p;
const ease = (p: number) => 0.5 - 0.5 * Math.cos(Math.PI * p);
const quad = (fl: number, fr: number, rl: number, rr: number): Quad => ({
	fl,
	fr,
	rl,
	rr,
});

function pickGear(speedKmh: number): number {
	for (let g = 1; g < GEAR_TOP_KMH.length; g++) {
		if (speedKmh < (GEAR_TOP_KMH[g] ?? Infinity) * 0.975) return g;
	}
	return GEAR_TOP_KMH.length - 1;
}

export type DemoFrame = { data: BackendTelemetryData; lapDelta: number };

/** Build one telemetry frame for simulation time `t` (seconds). */
export function createDemoFrame(t: number): DemoFrame {
	const lapIndex = Math.floor(t / LAP_SECONDS);
	const phase = (t % LAP_SECONDS) / LAP_SECONDS;
	const dir = lapIndex % 2 === 0 ? 1 : -1; // alternate left / right hander
	const jitter = (f: number, amp: number) =>
		amp * Math.sin(t * f) * Math.sin(t * f * 1.618 + 1.3);

	let speed: number;
	let throttle = 0;
	let brake = 0;
	let steer = 0;
	let latG = 0;
	let longG = 0;
	let slipRatio = quad(0.02, 0.02, 0.04, 0.04);
	let slipAngle = quad(0, 0, 0, 0);

	if (phase < 0.35) {
		// Full-throttle straight with upshifts.
		const p = phase / 0.35;
		speed = lerp(90, 186, ease(p) * 0.4 + p * 0.6);
		throttle = 1;
		longG = lerp(0.55, 0.28, p);
		steer = jitter(3.1, 0.03);
		latG = jitter(2.3, 0.05);
		slipRatio = quad(0.03, 0.03, 0.12, 0.12);
	} else if (phase < 0.42) {
		// Lift before the braking zone.
		const p = (phase - 0.35) / 0.07;
		speed = lerp(186, 180, p);
		throttle = lerp(1, 0.1, ease(p));
		longG = lerp(0.1, -0.15, p);
	} else if (phase < 0.58) {
		// Threshold braking, ABS pulsing the fronts.
		const p = (phase - 0.42) / 0.16;
		speed = lerp(180, 64, ease(p) * 0.5 + p * 0.5);
		brake = p < 0.08 ? p / 0.08 : 1;
		longG = -1.15 * brake + jitter(9, 0.06);
		const abs = Math.floor(t * 14) % 2 === 0;
		slipRatio = quad(
			abs ? -1.35 : -0.25,
			abs ? -1.2 : -0.22,
			-0.18,
			-0.18,
		);
	} else if (phase < 0.75) {
		// Trail-brake into the apex.
		const p = (phase - 0.58) / 0.17;
		speed = lerp(64, 46, p);
		brake = 0.85 * (1 - ease(p));
		throttle = p > 0.8 ? (p - 0.8) * 1.2 : 0;
		const turn = Math.sin((p * Math.PI) / 2);
		steer = dir * 0.72 * turn;
		latG = dir * 1.05 * turn + jitter(5, 0.05);
		longG = -0.7 * (1 - p);
		slipRatio = quad(-0.4 * (1 - p), -0.4 * (1 - p), -0.08, -0.08);
		slipAngle = quad(
			0.55 * turn + (dir > 0 ? 0.1 : 0),
			0.55 * turn + (dir < 0 ? 0.1 : 0),
			0.35 * turn,
			0.35 * turn,
		);
	} else {
		// Exit: unwind and squeeze the throttle until the rears break loose.
		const p = (phase - 0.75) / 0.25;
		speed = lerp(46, 90, ease(p));
		throttle = Math.min(1, p * 1.4);
		const turn = Math.cos((p * Math.PI) / 2);
		steer = dir * 0.6 * turn;
		latG = dir * 0.95 * turn;
		longG = 0.55 * Math.min(1, p * 1.5);
		const spin = throttle > 0.8 && p < 0.85 ? 1.25 : 0.15;
		slipRatio = quad(0.03, 0.03, spin, spin * 0.94);
		slipAngle = quad(0.3 * turn, 0.3 * turn, 0.75 * turn, 0.7 * turn);
	}

	const gear = pickGear(speed);
	const gearSpan = Math.min(1, speed / (GEAR_TOP_KMH[gear] ?? 1));
	const rpm = Math.min(
		RPM_REDLINE,
		RPM_IDLE + gearSpan * (RPM_REDLINE - RPM_IDLE) + jitter(11, 40),
	);

	// Static ride height ~0.10 m, compressed by weight transfer.
	const sus = (base: number) => Math.max(0, 0.1 + base + jitter(13, 0.002));
	const suspensionMeters = quad(
		sus(-longG * 0.012 - latG * 0.01),
		sus(-longG * 0.012 + latG * 0.01),
		sus(longG * 0.012 - latG * 0.01),
		sus(longG * 0.012 + latG * 0.01),
	);

	// Plausible rolling lap delta vs. a ghost, in seconds.
	const lapDelta =
		0.32 * Math.sin(t * 0.21) + 0.12 * Math.sin(t * 0.77 + 0.4) - 0.05;

	const G = 9.80665;
	return {
		data: {
			rpm,
			rpmMax: RPM_MAX,
			gear,
			speedKmh: speed,
			throttle,
			brake,
			steer,
			acceleration: { x: latG * G, y: 0, z: longG * G },
			gForce: { lateral: latG, longitudinal: longG },
			car: { drivetrain: 1 }, // RWD
			slipRatio,
			slipAngle,
			suspensionMeters,
			lap: { number: lapIndex + 1, racePosition: 1 },
		},
		lapDelta,
	};
}
