import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

// Web port of the mobile-v2 Momo (apps/mobile-v2/src/components/ai/momo-icon.tsx): same face, idle moments, moods and dozing

type Face = {
    leftEyeScale: number;
    rightEyeScale: number;
    eyeOffsetX: number;
    eyeOffsetY: number;
    leftBrowRaise: number;
    rightBrowRaise: number;
    smile: number;
    pupilScale: number;
    anger: number;
};

export type MomoMood = 'idle' | 'typing' | 'erasing' | 'angry' | 'happy';

type Rest = 'awake' | 'asleep' | 'away';

// One animated transform channel (tilt in degrees, bob/away in px) driven by CSS transitions
type Motion = { value: number; duration: number; easing: string };

const RESTING_FACE: Face = {
    leftEyeScale: 1,
    rightEyeScale: 1,
    eyeOffsetX: 0,
    eyeOffsetY: 0,
    leftBrowRaise: 0,
    rightBrowRaise: 0,
    smile: 0,
    pupilScale: 1,
    anger: 0,
};
const TYPING_FACE: Face = { ...RESTING_FACE, eyeOffsetY: 1.05, leftBrowRaise: 0.35, rightBrowRaise: 0.35, smile: 0.25 };
const SLEEP_FACE: Face = { ...RESTING_FACE, leftEyeScale: 0.08, rightEyeScale: 0.08, leftBrowRaise: 0.5, rightBrowRaise: 0.5, eyeOffsetY: 0.5, smile: -0.15 };
const DROWSY_AFTER_MS = 25000;
const FACE_TRANSITION_DURATION = 100;
const FACE_KEYS = Object.keys(RESTING_FACE) as Array<keyof Face>;

const EASE_OUT = 'cubic-bezier(0.33, 1, 0.68, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const BACK_IN = 'cubic-bezier(0.36, 0, 0.66, -0.56)';

function easeOutCubic(progress: number) {
    return 1 - Math.pow(1 - progress, 3);
}

interface MomoProps {
    /** Pixel size; omit to fill the parent (use className to size it) */
    size?: number;
    color?: string;
    pupilColor?: string;
    animated?: boolean;
    isPressed?: boolean;
    mood?: MomoMood;
    /** Horizontal gaze while typing, -1 (left) to 1 (right) */
    gaze?: number;
    /** After a stretch without activity Momo dozes off or wanders out of frame. Needs a clipping parent */
    drowsy?: boolean;
    className?: string;
}

function parseSizeFromClassName(className?: string): number | undefined {
    if (!className) return undefined;
    const arbitraryMatch = className.match(/\b(?:size|w|h)-\[(\d+(?:\.\d+)?)px\]\b/);
    if (arbitraryMatch) return parseFloat(arbitraryMatch[1]);
    const sizeMatch = className.match(/\bsize-(\d+(?:\.\d+)?)\b/);
    if (sizeMatch) return parseFloat(sizeMatch[1]) * 4;
    const hMatch = className.match(/\bh-(\d+(?:\.\d+)?)\b/);
    if (hMatch) return parseFloat(hMatch[1]) * 4;
    const wMatch = className.match(/\bw-(\d+(?:\.\d+)?)\b/);
    if (wMatch) return parseFloat(wMatch[1]) * 4;
    return undefined;
}

export function Momo({
    size,
    color = '#FFFFFF',
    pupilColor = '#111113',
    animated = true,
    isPressed = false,
    mood = 'idle',
    gaze = 0,
    drowsy = false,
    className,
}: MomoProps) {
    const hasSizingClass = className && /\b(size-\S+|[wh]-\S+)/.test(className);
    const boxStyle: CSSProperties | undefined = size
        ? { width: size, height: size }
        : hasSizingClass
            ? undefined
            : { width: 28, height: 28 };

    const resolvedSize = size ?? parseSizeFromClassName(className) ?? 28;

    if (!animated) {
        return (
            <span className={cn('relative inline-flex items-center justify-center', isPressed && 'scale-[0.88]', className)} style={boxStyle}>
                <MomoFace color={color} pupilColor={pupilColor} face={RESTING_FACE} />
            </span>
        );
    }

    return (
        <AnimatedMomo
            boxStyle={boxStyle}
            sizePx={resolvedSize}
            color={color}
            pupilColor={pupilColor}
            isPressed={isPressed}
            mood={mood}
            gaze={gaze}
            drowsy={drowsy}
            className={className}
        />
    );
}

function AnimatedMomo({
    boxStyle,
    sizePx,
    color,
    pupilColor,
    isPressed,
    mood,
    gaze,
    drowsy,
    className,
}: {
    boxStyle?: CSSProperties;
    sizePx: number;
    color: string;
    pupilColor: string;
    isPressed: boolean;
    mood: MomoMood;
    gaze: number;
    drowsy: boolean;
    className?: string;
}) {
    const [face, setFace] = useState<Face>(RESTING_FACE);
    const displayedFace = useRef<Face>(RESTING_FACE);
    const faceAnimation = useRef<number | null>(null);
    const [tilt, setTilt] = useState<Motion>({ value: 0, duration: 0, easing: EASE_OUT });
    const [bob, setBob] = useState<Motion>({ value: 0, duration: 0, easing: EASE_OUT });
    const [away, setAway] = useState<Motion>({ value: 0, duration: 0, easing: EASE_OUT });
    const [rest, setRest] = useState<Rest>('awake');
    const restRef = useRef<Rest>('awake');
    const moodRef = useRef<MomoMood>(mood);
    const idleSteps = useRef<Array<Partial<Face> | null>>([]);
    const sequenceTimers = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});

    // Run a chain of [value, duration, easing, delayBefore] steps on one motion channel, cancelling any previous chain
    const sequence = useCallback((channel: 'tilt' | 'bob' | 'away', steps: Array<[number, number, string, number?]>) => {
        const setter = channel === 'tilt' ? setTilt : channel === 'bob' ? setBob : setAway;
        (sequenceTimers.current[channel] || []).forEach(clearTimeout);
        const timers: ReturnType<typeof setTimeout>[] = [];
        let at = 0;
        steps.forEach(([value, duration, easing, delay = 0]) => {
            at += delay;
            timers.push(setTimeout(() => setter({ value, duration, easing }), at));
            at += duration;
        });
        sequenceTimers.current[channel] = timers;
    }, []);

    const transitionFace = useCallback((update: Partial<Face>) => {
        if (faceAnimation.current !== null) cancelAnimationFrame(faceAnimation.current);
        const from = displayedFace.current;
        const to = { ...from, ...update };
        let startedAt: number | null = null;

        const animate = (timestamp: number) => {
            if (startedAt === null) startedAt = timestamp;
            const progress = Math.min((timestamp - startedAt) / FACE_TRANSITION_DURATION, 1);
            const eased = easeOutCubic(progress);
            const next = { ...to };
            for (const key of FACE_KEYS) next[key] = from[key] + (to[key] - from[key]) * eased;
            displayedFace.current = next;
            setFace(next);
            faceAnimation.current = progress < 1 ? requestAnimationFrame(animate) : null;
        };
        faceAnimation.current = requestAnimationFrame(animate);
    }, []);

    // Idle moments: blinks, winks, curious tilts, glances, little hops, squints
    useEffect(() => {
        const steps = idleSteps.current;
        let idleTicks = 12 + Math.floor(Math.random() * 10);
        const hold = (ticks: number) => Array.from<null>({ length: ticks }).fill(null);
        const idleInterval = setInterval(() => {
            if (moodRef.current !== 'idle' || restRef.current !== 'awake') return;
            if (steps.length) {
                const step = steps.shift();
                if (step) transitionFace(step);
                return;
            }
            idleTicks -= 1;
            if (idleTicks > 0) return;

            const moment = Math.floor(Math.random() * 7);
            idleTicks = 24 + Math.floor(Math.random() * 26);

            if (moment === 0) {
                steps.splice(0, steps.length, { leftEyeScale: 0.08, rightEyeScale: 0.08 }, RESTING_FACE);
            } else if (moment === 1) {
                steps.splice(0, steps.length,
                    { leftEyeScale: 0.08, rightEyeScale: 0.08 }, RESTING_FACE,
                    { leftEyeScale: 0.08, rightEyeScale: 0.08 }, RESTING_FACE,
                );
            } else if (moment === 2) {
                const winkLeft = Math.random() > 0.5;
                steps.splice(0, steps.length,
                    {
                        leftEyeScale: winkLeft ? 0.08 : 1,
                        rightEyeScale: winkLeft ? 1 : 0.08,
                        leftBrowRaise: winkLeft ? -1.3 : 0,
                        rightBrowRaise: winkLeft ? 0 : -1.3,
                        smile: 1,
                    },
                    ...hold(3),
                    RESTING_FACE,
                );
            } else if (moment === 3) {
                const direction = Math.random() > 0.5 ? 1 : -1;
                sequence('tilt', [[direction * 7, 260, EASE_OUT], [0, 340, EASE_IN_OUT, 720]]);
                steps.splice(0, steps.length,
                    {
                        eyeOffsetX: direction * 0.65,
                        eyeOffsetY: -0.3,
                        leftBrowRaise: direction > 0 ? -1.2 : 0.35,
                        rightBrowRaise: direction < 0 ? -1.2 : 0.35,
                        pupilScale: 1.18,
                    },
                    ...hold(8),
                    RESTING_FACE,
                );
            } else if (moment === 4) {
                const direction = Math.random() > 0.5 ? 1 : -1;
                steps.splice(0, steps.length,
                    { eyeOffsetX: direction * 1.25, eyeOffsetY: 0.15 }, ...hold(3),
                    { eyeOffsetX: direction * 0.55 }, ...hold(2),
                    RESTING_FACE,
                );
            } else if (moment === 5) {
                sequence('bob', [[-2.4, 120, EASE_OUT], [0, 130, EASE_OUT], [-1.7, 110, EASE_OUT], [0, 260, SPRING]]);
                steps.splice(0, steps.length, { smile: 1, pupilScale: 1.28 }, ...hold(4), RESTING_FACE);
            } else {
                steps.splice(0, steps.length, { leftEyeScale: 0.55, rightEyeScale: 0.55, smile: 0.8 }, ...hold(5), RESTING_FACE);
            }
        }, 110);

        const timers = sequenceTimers.current;
        return () => {
            clearInterval(idleInterval);
            Object.values(timers).flat().forEach(clearTimeout);
            if (faceAnimation.current !== null) cancelAnimationFrame(faceAnimation.current);
        };
    }, [sequence, transitionFace]);

    // Reactions to what the user is doing in the composer override idle moments
    useEffect(() => {
        moodRef.current = mood;
        idleSteps.current.length = 0;

        if (mood === 'typing') {
            sequence('tilt', [[0, 200, EASE_OUT]]);
        } else if (mood === 'erasing') {
            transitionFace({ ...RESTING_FACE, eyeOffsetX: -1.3, eyeOffsetY: 0.2, leftBrowRaise: 0.6, rightBrowRaise: -1.4, smile: -0.35, pupilScale: 0.85 });
            sequence('tilt', [[-6, 240, EASE_OUT]]);
        } else if (mood === 'angry') {
            transitionFace({ ...RESTING_FACE, anger: 1, smile: -1, leftEyeScale: 0.7, rightEyeScale: 0.7, pupilScale: 0.75 });
            sequence('tilt', [[-7, 60, EASE_OUT], [7, 80, EASE_OUT], [-5, 80, EASE_OUT], [4, 80, EASE_OUT], [0, 260, SPRING]]);
        } else if (mood === 'happy') {
            transitionFace({ ...RESTING_FACE, leftEyeScale: 0.3, rightEyeScale: 0.3, leftBrowRaise: -0.8, rightBrowRaise: -0.8, smile: 1, pupilScale: 1.2 });
            sequence('tilt', [[0, 200, EASE_OUT]]);
            sequence('bob', [[-3, 110, EASE_OUT], [0, 120, EASE_OUT], [-2.4, 110, EASE_OUT], [0, 120, EASE_OUT], [-1.6, 100, EASE_OUT], [0, 260, SPRING]]);
        } else {
            transitionFace(RESTING_FACE);
            sequence('tilt', [[0, 260, EASE_OUT]]);
        }
    }, [mood, sequence, transitionFace]);

    // Any activity wakes Momo and restarts the countdown to dozing off or wandering away
    useEffect(() => {
        if (!drowsy) return;
        const wakeTimer = setTimeout(() => setRest('awake'), 0);
        const timer = setTimeout(() => setRest(Math.random() < 0.5 ? 'asleep' : 'away'), DROWSY_AFTER_MS);
        return () => {
            clearTimeout(wakeTimer);
            clearTimeout(timer);
        };
    }, [drowsy, isPressed, mood]);

    useEffect(() => {
        const previous = restRef.current;
        restRef.current = rest;
        const timers: Array<ReturnType<typeof setTimeout>> = [];
        const later = (ms: number, run: () => void) => timers.push(setTimeout(run, ms));
        const hidden = sizePx * 1.3;

        if (rest === 'asleep') {
            idleSteps.current.length = 0;
            transitionFace({ ...RESTING_FACE, leftEyeScale: 0.45, rightEyeScale: 0.45, eyeOffsetY: 0.4 });
            later(700, () => transitionFace(SLEEP_FACE));
            sequence('tilt', [[8, 1500, EASE_IN_OUT, 500]]);
        } else if (rest === 'away') {
            idleSteps.current.length = 0;
            // A glance to the side, then he slips down out of the tile
            transitionFace({ ...RESTING_FACE, eyeOffsetX: 1.2 });
            sequence('away', [[hidden, 520, BACK_IN, 600]]);

            // Every so often he peeks back up over the edge, looks around and ducks again
            const peek = () => {
                const direction = Math.random() > 0.5 ? 1 : -1;
                transitionFace({ ...RESTING_FACE, eyeOffsetX: direction * 1.2, eyeOffsetY: -0.5, leftBrowRaise: -0.9, rightBrowRaise: -0.9, pupilScale: 1.2 });
                sequence('away', [[sizePx * 0.66, 420, EASE_OUT], [hidden, 260, EASE_IN_OUT, 1500]]);
                later(1000, () => transitionFace({ eyeOffsetX: -direction * 1.2 }));
                later(5000 + Math.random() * 4000, peek);
            };
            later(3500 + Math.random() * 2500, peek);
        } else {
            if (previous === 'away') sequence('away', [[0, 420, SPRING]]);
            if (previous !== 'awake' && moodRef.current === 'idle') {
                // Startled awake: wide eyes, a hop, then back to normal
                transitionFace({ ...RESTING_FACE, pupilScale: 1.35, leftBrowRaise: -1.2, rightBrowRaise: -1.2 });
                sequence('tilt', [[0, 180, EASE_OUT]]);
                sequence('bob', [[-3, 90, EASE_OUT], [0, 260, SPRING]]);
                later(650, () => transitionFace(RESTING_FACE));
            }
        }
        return () => timers.forEach(clearTimeout);
    }, [rest, sizePx, sequence, transitionFace]);

    // While typing Momo looks down at the text, eyes following it along the line
    useEffect(() => {
        if (mood === 'typing') transitionFace({ ...TYPING_FACE, eyeOffsetX: Math.max(-1, Math.min(1, gaze)) * 1.1 });
    }, [gaze, mood, transitionFace]);

    // translate (bob + away) and rotate animate on separate elements so their timings stay independent
    return (
        <span className={cn('relative inline-flex items-center justify-center', className)} style={boxStyle}>
            <span
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    transform: `translateY(${bob.value + away.value}px)`,
                    transition: `transform ${Math.max(bob.duration, away.duration)}ms ${away.duration > bob.duration ? away.easing : bob.easing}`,
                }}
            >
                <span
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ transform: `rotate(${tilt.value}deg)`, transition: `transform ${tilt.duration}ms ${tilt.easing}` }}
                >
                    <span
                        className="momo-breath absolute inset-0 flex items-center justify-center"
                        style={{ scale: isPressed ? '0.88' : '1', transition: `scale 220ms ${SPRING}` }}
                    >
                        <MomoFace color={color} pupilColor={pupilColor} face={face} />
                    </span>
                </span>
            </span>
            {rest === 'asleep' && [0, 1, 2].map((index) => (
                <span
                    key={index}
                    className="momo-sleep-z pointer-events-none absolute font-extrabold"
                    style={{
                        color,
                        fontSize: sizePx * 0.26,
                        lineHeight: `${sizePx * 0.3}px`,
                        right: sizePx * 0.1,
                        top: sizePx * 0.08,
                        animationDelay: `${900 + index * 750}ms`,
                        ['--momo-z-x' as string]: `${sizePx * 0.14}px`,
                        ['--momo-z-y' as string]: `${-sizePx * 0.26}px`,
                    }}
                >
                    z
                </span>
            ))}
        </span>
    );
}

function MomoFace({ color, pupilColor, face }: { color: string; pupilColor: string; face: Face }) {
    // smile runs from -1 (frown) through 0 (neutral) to 1 (grin) without jumps
    const smile = Math.max(-1, Math.min(1, face.smile));
    const frown = Math.max(0, -smile);
    const grin = Math.max(0, smile);
    const mouthInset = 8 - grin + frown;
    const mouthEdgeY = 17 - grin * 0.5 + frown * 1.3;
    const mouthControlY = 18.5 + grin * 1.6 - frown * 3;
    const mouthPath = `M${mouthInset} ${mouthEdgeY} Q12 ${mouthControlY} ${24 - mouthInset} ${mouthEdgeY}`;

    // Anger pulls the inner brow ends down into a V
    const anger = face.anger;
    const leftBrow = `M6 ${11.5 + face.leftBrowRaise - anger * 0.6} Q8.5 ${10.5 + face.leftBrowRaise + anger * 1.4} 11 ${11.5 + face.leftBrowRaise + anger * 1.4}`;
    const rightBrow = `M13 ${11.5 + face.rightBrowRaise + anger * 1.4} Q15.5 ${10.5 + face.rightBrowRaise + anger * 1.4} 18 ${11.5 + face.rightBrowRaise - anger * 0.6}`;

    return (
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="5" width="20" height="15" rx="3" stroke={color} strokeWidth="1.6" />
            <path d="M2 8h20" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
            <path d={leftBrow} stroke={color} strokeWidth="1.15" strokeLinecap="round" />
            <path d={rightBrow} stroke={color} strokeWidth="1.15" strokeLinecap="round" />
            <ellipse cx={8.5 + face.eyeOffsetX} cy={14 + face.eyeOffsetY} rx="1.3" ry={Math.max(0.1, 1.45 * face.leftEyeScale)} fill={color} />
            <ellipse cx={15.5 + face.eyeOffsetX} cy={14 + face.eyeOffsetY} rx="1.3" ry={Math.max(0.1, 1.45 * face.rightEyeScale)} fill={color} />
            {face.leftEyeScale > 0.3 && (
                <circle cx={8.75 + face.eyeOffsetX * 1.45} cy={13.75 + face.eyeOffsetY} r={0.39 * face.pupilScale} fill={pupilColor} />
            )}
            {face.rightEyeScale > 0.3 && (
                <circle cx={15.75 + face.eyeOffsetX * 1.45} cy={13.75 + face.eyeOffsetY} r={0.39 * face.pupilScale} fill={pupilColor} />
            )}
            <path d={mouthPath} stroke={color} strokeWidth="1.35" strokeLinecap="round" />
        </svg>
    );
}
