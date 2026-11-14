import { Momo } from '@/components/ai/Momo';
import { cn } from '@/lib/utils';

interface MomoIconProps {
    size?: number;
    className?: string;
    isHovered?: boolean;
    isPressed?: boolean;
    isAngry?: boolean;
}

// Chat-widget entry point for Momo; delegates to the shared port of the mobile mascot.
// The face strokes follow `currentColor`, so callers keep tinting it with text-* classes.
export function MomoIcon({
    size,
    className,
    isHovered = false,
    isPressed = false,
    isAngry = false,
}: MomoIconProps) {
    const isHidden = className?.includes('text-transparent');
    return (
        <Momo
            size={size}
            color="currentColor"
            isPressed={isPressed}
            mood={isAngry ? 'angry' : isHovered ? 'happy' : 'idle'}
            className={cn(className, isHidden && 'opacity-0')}
        />
    );
}
