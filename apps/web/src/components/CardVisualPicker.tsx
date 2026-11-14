import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Trash2,
  Palette,
  Sparkles,
  Check,
  X,
  CreditCard,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  compressImage,
  getStoredCardSkins,
  saveStoredCardSkin,
  deleteStoredCardSkin,
  CARD_SKIN_PRESETS,
  POPULAR_CARD_COLORS,
} from "@/lib/image-utils";
import { toast } from "sonner";

interface CardVisualPickerProps {
  color?: string;
  skinUrl?: string;
  onColorChange: (color: string) => void;
  onSkinChange: (skinUrl: string | undefined) => void;
  cardName?: string;
  last4Digits?: string;
}

export function CardVisualPicker({
  color = "#8B5CF6",
  skinUrl,
  onColorChange,
  onSkinChange,
  cardName = "Card",
  last4Digits,
}: CardVisualPickerProps) {
  const [activeTab, setActiveTab] = useState<string>(skinUrl ? "skins" : "colors");
  const [uploadedSkins, setUploadedSkins] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUploadedSkins(getStoredCardSkins());
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    try {
      setIsUploading(true);
      // High-res card skin, compressed to ~800x500 webp (~35-50KB)
      const compressed = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 500,
        quality: 0.85,
        mimeType: "image/webp",
      });

      const updated = saveStoredCardSkin(compressed);
      setUploadedSkins(updated);
      onSkinChange(compressed);
      toast.success("Skin uploaded & optimized");
    } catch (err) {
      console.error("Skin upload error:", err);
      toast.error("Failed to process skin image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteUploadedSkin = (urlToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteStoredCardSkin(urlToDelete);
    setUploadedSkins(updated);
    if (skinUrl === urlToDelete) {
      onSkinChange(undefined);
    }
  };

  const normalizedLast4 = (last4Digits ?? "").replace(/\D/g, "").slice(-4);

  return (
    <div className="space-y-4">
      {/* Live Mini Card Preview */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Live Card Preview
          </Label>
          {skinUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSkinChange(undefined)}
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-white"
            >
              <X className="size-3 mr-1" />
              Remove Skin
            </Button>
          )}
        </div>

        <div
          className="relative w-full h-[140px] rounded-xl overflow-hidden p-3.5 text-white flex flex-col justify-between shadow-xl border border-white/15 transition-all"
          style={{
            backgroundImage: skinUrl
              ? `url("${skinUrl}")`
              : `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color} 50%, #080811) 100%)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Subtle sheen & dark contrast layer if skin is used */}
          {skinUrl && (
            <div className="pointer-events-none absolute inset-0 bg-black/25 backdrop-brightness-95" />
          )}
          <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_0_0_1px_rgba(255,255,255,0.12)]" />

          {/* Top row */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="font-bold text-sm truncate drop-shadow-sm max-w-[200px]">
              {cardName || "Main Card"}
            </span>
            <Wifi className="size-4 opacity-70 rotate-90" />
          </div>

          {/* Chip & details */}
          <div className="relative z-10 flex items-center gap-2">
            <svg
              className="w-7 h-5 opacity-80"
              viewBox="0 0 40 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0.5"
                y="0.5"
                width="39"
                height="27"
                rx="4.5"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M 0 9 L 14 9 M 0 19 L 14 19 M 26 9 L 40 9 M 26 19 L 40 19 M 14 0 L 14 28 M 26 0 L 26 28"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.8"
              />
              <rect x="14" y="9" width="12" height="10" fill="currentColor" fillOpacity="0.2" />
            </svg>
            {normalizedLast4 && (
              <span className="font-mono text-xs tracking-widest opacity-90 drop-shadow-sm">
                •••• {normalizedLast4}
              </span>
            )}
          </div>

          {/* Bottom row */}
          <div className="relative z-10 flex items-center justify-between text-[11px] opacity-80 font-medium">
            <span>DEBIT</span>
            <span>09/29</span>
          </div>
        </div>
      </div>

      {/* Tabs for Color / Skin Selection */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full bg-muted/40">
          <TabsTrigger value="skins" className="text-xs flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            Card Skin
          </TabsTrigger>
          <TabsTrigger value="colors" className="text-xs flex items-center gap-1.5">
            <Palette className="size-3.5" />
            Card Color
          </TabsTrigger>
        </TabsList>

        {/* SKINS TAB */}
        <TabsContent value="skins" className="space-y-3 pt-2">
          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-xs h-9"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="size-3.5" />
              {isUploading ? "Optimizing Skin..." : "Upload Custom Card Skin"}
            </Button>
          </div>

          {/* Previously Uploaded Skins */}
          {uploadedSkins.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Uploaded Skins
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {uploadedSkins.length} saved
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-[110px] overflow-y-auto pr-1">
                {uploadedSkins.map((url, i) => {
                  const isSelected = skinUrl === url;
                  return (
                    <div
                      key={i}
                      onClick={() => onSkinChange(url)}
                      className={cn(
                        "group relative h-14 rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-primary/60 transition-all",
                        isSelected && "ring-2 ring-primary border-primary"
                      )}
                      style={{
                        backgroundImage: `url("${url}")`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                          <Check className="size-4 text-white" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteUploadedSkin(url, e)}
                        title="Delete skin"
                        className="absolute right-1 top-1 hidden size-4 items-center justify-center rounded-full bg-black/80 text-white/70 hover:text-red-400 group-hover:flex"
                      >
                        <Trash2 className="size-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preset Skins */}
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Preset Card Skins
            </span>
            <div className="grid grid-cols-3 gap-2">
              {CARD_SKIN_PRESETS.map((preset) => {
                const isSelected = skinUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSkinChange(preset.url)}
                    className={cn(
                      "relative h-14 rounded-lg overflow-hidden border border-white/10 hover:border-primary/60 transition-all text-left flex flex-col justify-end p-1.5",
                      isSelected && "ring-2 ring-primary border-primary"
                    )}
                    style={{
                      backgroundImage: `url("${preset.url}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <span className="relative z-10 text-[9px] font-bold text-white drop-shadow-md truncate">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                        <Check className="size-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* COLORS TAB */}
        <TabsContent value="colors" className="space-y-3 pt-2">
          {/* Swatches */}
          <div className="grid grid-cols-6 gap-2">
            {POPULAR_CARD_COLORS.map((c) => {
              const isSelected = !skinUrl && color.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => {
                    onColorChange(c.hex);
                    if (skinUrl) onSkinChange(undefined);
                  }}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl border border-white/10 transition-transform hover:scale-110",
                    isSelected && "ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-105"
                  )}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && <Check className="size-3.5 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>

          {/* Custom Color Input */}
          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
            <div className="relative">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  onColorChange(e.target.value);
                  if (skinUrl) onSkinChange(undefined);
                }}
                className="w-9 h-9 p-0.5 rounded-lg border border-white/15 bg-transparent cursor-pointer"
              />
            </div>
            <Input
              value={color}
              onChange={(e) => {
                onColorChange(e.target.value);
                if (skinUrl) onSkinChange(undefined);
              }}
              placeholder="#8B5CF6"
              className="font-mono text-xs uppercase h-9 flex-1"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
