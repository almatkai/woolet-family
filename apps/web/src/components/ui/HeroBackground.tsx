"use client";

import Particles from "./Particles";
import AnimatedGridPattern from "./AnimatedGridPattern";
import Spotlight from "./Spotlight";
import { useTheme } from "../theme-provider";

interface HeroBackgroundProps {
    className?: string;
}

export function HeroBackground({ className }: HeroBackgroundProps) {
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === "light";

    return (
        <div className={className}>
            {/* Particles */}
            <Particles
                className="absolute inset-0"
                quantity={80}
                ease={80}
                color={isLight ? "#64748b" : "#ffffff"}
                size={0.5}
            />

            {/* Animated Grid Pattern */}
            <AnimatedGridPattern
                numSquares={30}
                maxOpacity={0.1}
                duration={3}
                className={`absolute inset-0 ${isLight ? "fill-slate-950/[0.02] stroke-slate-950/[0.05] text-slate-300" : "fill-white/[0.02] stroke-white/[0.04] text-white"}`}
            />

            {/* Spotlight */}
            <Spotlight
                className="-top-40 left-0 md:left-60 md:-top-20 h-dvh"
                fill={isLight ? "#94a3b8" : "white"}
            />
        </div>
    );
}

export default HeroBackground;
