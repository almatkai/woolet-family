/**
 * Utility functions for image compression, gallery storage, and account visual customization.
 */

export interface AccountVisual {
    icon?: string;
    color?: string;
    skinUrl?: string;
}

/**
 * Parses account icon string which may contain:
 * 1. A JSON object: { icon?: string, color?: string, skinUrl?: string }
 * 2. An image data URL / HTTP URL: treated as skinUrl
 * 3. A hex color code: treated as color
 * 4. A plain emoji or icon string (e.g. "💳")
 */
export function parseAccountVisual(rawIcon?: string | null): AccountVisual {
    if (!rawIcon) return {};

    const trimmed = rawIcon.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
            const parsed = JSON.parse(trimmed);
            return {
                icon: typeof parsed.icon === 'string' ? parsed.icon : undefined,
                color: typeof parsed.color === 'string' ? parsed.color : undefined,
                skinUrl: typeof parsed.skinUrl === 'string' ? parsed.skinUrl : undefined,
            };
        } catch {
            return { icon: trimmed };
        }
    }

    if (
        trimmed.startsWith('data:image/') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('/') ||
        trimmed.startsWith('blob:')
    ) {
        return { skinUrl: trimmed };
    }

    if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) {
        return { color: trimmed };
    }

    return { icon: trimmed };
}

/**
 * Serializes account visual options into a single string for storage.
 */
export function serializeAccountVisual(visual: AccountVisual): string | undefined {
    const { icon, color, skinUrl } = visual;

    // If only an emoji/icon without custom color or skin, keep as plain string for compatibility
    if (icon && !color && !skinUrl && !icon.startsWith('{')) {
        return icon;
    }

    if (!icon && !color && !skinUrl) {
        return undefined;
    }

    return JSON.stringify({
        ...(icon ? { icon } : {}),
        ...(color ? { color } : {}),
        ...(skinUrl ? { skinUrl } : {}),
    });
}

/**
 * Compresses an image client-side via HTML5 Canvas.
 * Keeps aspect ratio within maxWidth/maxHeight and outputs an optimized WebP or JPEG data URL.
 */
export async function compressImage(
    file: File | Blob,
    options: {
        maxWidth: number;
        maxHeight: number;
        quality?: number;
        mimeType?: 'image/webp' | 'image/jpeg' | 'image/png';
    }
): Promise<string> {
    const { maxWidth, maxHeight, quality = 0.86, mimeType = 'image/webp' } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Failed to load image element'));
            img.onload = () => {
                let { width, height } = img;

                // Scale down to fit inside max dimensions
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(reader.result as string);
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                try {
                    const dataUrl = canvas.toDataURL(mimeType, quality);
                    // Verify if browser actually supported the requested mimeType
                    if (dataUrl.startsWith(`data:${mimeType}`)) {
                        resolve(dataUrl);
                    } else {
                        // Fallback to jpeg
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    }
                } catch {
                    resolve(reader.result as string);
                }
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    });
}

// -------------------------------------------------------------
// Gallery Storage for Uploaded Bank Logos & Card Skins
// -------------------------------------------------------------

const STORAGE_KEY_BANK_ICONS = 'woolet_uploaded_bank_icons';
const STORAGE_KEY_CARD_SKINS = 'woolet_uploaded_card_skins';
const MAX_GALLERY_ITEMS = 30;

export function getStoredBankIcons(): string[] {
    try {
        const item = localStorage.getItem(STORAGE_KEY_BANK_ICONS);
        return item ? JSON.parse(item) : [];
    } catch {
        return [];
    }
}

export function saveStoredBankIcon(dataUrl: string): string[] {
    try {
        const existing = getStoredBankIcons().filter((u) => u !== dataUrl);
        const updated = [dataUrl, ...existing].slice(0, MAX_GALLERY_ITEMS);
        localStorage.setItem(STORAGE_KEY_BANK_ICONS, JSON.stringify(updated));
        return updated;
    } catch {
        return [];
    }
}

export function deleteStoredBankIcon(dataUrl: string): string[] {
    try {
        const existing = getStoredBankIcons().filter((u) => u !== dataUrl);
        localStorage.setItem(STORAGE_KEY_BANK_ICONS, JSON.stringify(existing));
        return existing;
    } catch {
        return [];
    }
}

export function getStoredCardSkins(): string[] {
    try {
        const item = localStorage.getItem(STORAGE_KEY_CARD_SKINS);
        return item ? JSON.parse(item) : [];
    } catch {
        return [];
    }
}

export function saveStoredCardSkin(dataUrl: string): string[] {
    try {
        const existing = getStoredCardSkins().filter((u) => u !== dataUrl);
        const updated = [dataUrl, ...existing].slice(0, MAX_GALLERY_ITEMS);
        localStorage.setItem(STORAGE_KEY_CARD_SKINS, JSON.stringify(updated));
        return updated;
    } catch {
        return [];
    }
}

export function deleteStoredCardSkin(dataUrl: string): string[] {
    try {
        const existing = getStoredCardSkins().filter((u) => u !== dataUrl);
        localStorage.setItem(STORAGE_KEY_CARD_SKINS, JSON.stringify(existing));
        return existing;
    } catch {
        return [];
    }
}

// -------------------------------------------------------------
// Presets
// -------------------------------------------------------------

export interface CardSkinPreset {
    id: string;
    name: string;
    url: string;
    preview: string;
}

/**
 * Built-in card skin presets crafted with high-res SVG data URIs
 */
export const CARD_SKIN_PRESETS: CardSkinPreset[] = [
    {
        id: 'obsidian-gold',
        name: 'Obsidian Gold',
        url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23111827"/><stop offset="50%" stop-color="%231f2937"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="gold" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="%23f59e0b" stop-opacity="0.8"/><stop offset="40%" stop-color="%23fbbf24" stop-opacity="0.3"/><stop offset="100%" stop-color="%23d97706" stop-opacity="0"/></linearGradient></defs><rect width="600" height="380" fill="url(%23bg)"/><path d="M-50,380 Q150,180 350,300 T650,150 L650,380 Z" fill="url(%23gold)"/><circle cx="500" cy="80" r="140" fill="%23f59e0b" fill-opacity="0.08"/><circle cx="100" cy="320" r="180" fill="%23fbbf24" fill-opacity="0.05"/></svg>`,
        preview: 'linear-gradient(135deg, #1f2937 0%, #0f172a 100%)',
    },
    {
        id: 'neon-cyber',
        name: 'Neon Cyber',
        url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23090d16"/><stop offset="100%" stop-color="%23180d2c"/></linearGradient><linearGradient id="cyan-glow" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%2306b6d4" stop-opacity="0.6"/><stop offset="100%" stop-color="%238b5cf6" stop-opacity="0.1"/></linearGradient></defs><rect width="600" height="380" fill="url(%23bg)"/><path d="M0,0 L600,380 L600,0 Z" fill="url(%23cyan-glow)" opacity="0.4"/><circle cx="520" cy="60" r="160" fill="%23ec4899" fill-opacity="0.25"/><circle cx="80" cy="300" r="130" fill="%2306b6d4" fill-opacity="0.2"/></svg>`,
        preview: 'linear-gradient(135deg, #090d16 0%, #180d2c 100%)',
    },
    {
        id: 'aurora-borealis',
        name: 'Aurora Borealis',
        url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23041c2c"/><stop offset="100%" stop-color="%23020b12"/></linearGradient><linearGradient id="aurora" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%2310b981" stop-opacity="0.7"/><stop offset="50%" stop-color="%2306b6d4" stop-opacity="0.5"/><stop offset="100%" stop-color="%236366f1" stop-opacity="0.1"/></linearGradient></defs><rect width="600" height="380" fill="url(%23bg)"/><path d="M-100,200 Q100,50 300,160 T700,80 L700,380 L-100,380 Z" fill="url(%23aurora)" opacity="0.6"/></svg>`,
        preview: 'linear-gradient(135deg, #041c2c 0%, #020b12 100%)',
    },
    {
        id: 'titanium-matrix',
        name: 'Titanium Carbon',
        url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%2327272a"/><stop offset="50%" stop-color="%2318181b"/><stop offset="100%" stop-color="%2309090b"/></linearGradient><pattern id="mesh" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 20 M 0 0 L 20 20" fill="none" stroke="%23ffffff" stroke-width="0.7" stroke-opacity="0.07"/></pattern></defs><rect width="600" height="380" fill="url(%23bg)"/><rect width="600" height="380" fill="url(%23mesh)"/><circle cx="480" cy="100" r="180" fill="%23ffffff" fill-opacity="0.04"/></svg>`,
        preview: 'linear-gradient(135deg, #27272a 0%, #09090b 100%)',
    },
    {
        id: 'crimson-velvet',
        name: 'Crimson Velvet',
        url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%234c0519"/><stop offset="50%" stop-color="%23881337"/><stop offset="100%" stop-color="%231c0209"/></linearGradient></defs><rect width="600" height="380" fill="url(%23bg)"/><circle cx="450" cy="80" r="190" fill="%23f43f5e" fill-opacity="0.25"/><circle cx="120" cy="300" r="160" fill="%23fb7185" fill-opacity="0.15"/></svg>`,
        preview: 'linear-gradient(135deg, #4c0519 0%, #1c0209 100%)',
    },
];

export const POPULAR_CARD_COLORS = [
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'Cyan', hex: '#06B6D4' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Amber', hex: '#F59E0B' },
    { name: 'Emerald', hex: '#10B981' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Indigo', hex: '#6366F1' },
    { name: 'Rose', hex: '#F43F5E' },
    { name: 'Slate', hex: '#475569' },
    { name: 'Dark', hex: '#18181B' },
];
