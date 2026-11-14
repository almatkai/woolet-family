import { Momo, type MomoMood } from './Momo';

export type { MomoMood };

interface MomoAvatarProps {
    size?: number;
    color?: string;
    pupilColor?: string;
    mood?: MomoMood;
    /** Kept for existing call sites; the animated Momo is always lively */
    interactive?: boolean;
    className?: string;
    onClick?: () => void;
}

// Thin wrapper so older call sites render the same Momo as the mobile app
export function MomoAvatar({ size = 40, color, pupilColor, mood, className, onClick }: MomoAvatarProps) {
    return (
        <span onClick={onClick} className="inline-flex">
            <Momo size={size} color={color} pupilColor={pupilColor} mood={mood} className={className} />
        </span>
    );
}
