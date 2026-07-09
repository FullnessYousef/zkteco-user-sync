import { useEffect, useRef, useState } from 'react';

interface Props {
    value: number;
    duration?: number;
    className?: string;
}

/**
 * Counts up (or down) to `value` whenever it changes, easing over `duration` ms.
 * Used so counters visibly tick during a sync instead of jumping.
 */
export function AnimatedNumber({ value, duration = 600, className }: Props) {
    const [display, setDisplay] = useState(value);
    const fromRef = useRef(value);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const from = fromRef.current;
        const to = value;

        if (from === to) {
            return;
        }

        let start: number | null = null;

        const step = (timestamp: number) => {
            if (start === null) {
                start = timestamp;
            }

            const progress = Math.min(1, (timestamp - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(from + (to - from) * eased));

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(step);
            } else {
                fromRef.current = to;
            }
        };

        frameRef.current = requestAnimationFrame(step);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
            fromRef.current = value;
        };
    }, [value, duration]);

    return <span className={className}>{display}</span>;
}
