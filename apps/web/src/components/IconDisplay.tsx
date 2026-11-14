import { iconMap } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { parseAccountVisual } from "@/lib/image-utils";

interface IconDisplayProps {
  icon?: string | null;
  className?: string;
  fallback?: string;
}

export function IconDisplay({ icon, className, fallback = "🏦" }: IconDisplayProps) {
  if (!icon) {
    return <span className={cn("flex items-center justify-center", className)}>{fallback}</span>;
  }

  let effectiveIcon = icon;
  // If icon is JSON encoded visual, extract inner icon or skinUrl
  if (icon.startsWith('{') && icon.endsWith('}')) {
    const visual = parseAccountVisual(icon);
    effectiveIcon = visual.icon || visual.skinUrl || fallback;
  }

  // Check if it's an image (data URL, blob, web URL, or local path)
  if (
    effectiveIcon.startsWith('data:image/') ||
    effectiveIcon.startsWith('http://') ||
    effectiveIcon.startsWith('https://') ||
    effectiveIcon.startsWith('/') ||
    effectiveIcon.startsWith('blob:')
  ) {
    return (
      <img
        src={effectiveIcon}
        alt="icon"
        className={cn("object-cover shrink-0 select-none", className)}
        onError={(e) => {
          // If image fails to load, replace with fallback
          const target = e.currentTarget;
          target.style.display = 'none';
          if (target.parentElement) {
            target.parentElement.textContent = fallback;
          }
        }}
      />
    );
  }

  // Check if it's a known Lucide icon
  const IconComponent = iconMap[effectiveIcon];

  if (IconComponent) {
    return <IconComponent className={cn("h-4 w-4", className)} />;
  }

  // Fallback to text (emoji)
  return <span className={cn("text-lg leading-none flex items-center justify-center", className)}>{effectiveIcon}</span>;
}
