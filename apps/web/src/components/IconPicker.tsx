import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { iconNames } from "@/lib/icons";
import { IconDisplay } from "./IconDisplay";
import { cn } from "@/lib/utils";
import { Upload, Trash2, Search, Image as ImageIcon, Sparkles, Check } from "lucide-react";
import {
  compressImage,
  getStoredBankIcons,
  saveStoredBankIcon,
  deleteStoredBankIcon,
} from "@/lib/image-utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

// Built-in recognizable bank SVG icons / monograms
const BANK_PRESETS = [
  {
    name: "Kaspi",
    icon: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23f14635"/><text x="50" y="68" font-family="system-ui,sans-serif" font-weight="900" font-size="58" fill="white" text-anchor="middle">K</text></svg>`,
  },
  {
    name: "Halyk",
    icon: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23008450"/><text x="50" y="68" font-family="system-ui,sans-serif" font-weight="900" font-size="58" fill="white" text-anchor="middle">H</text></svg>`,
  },
  {
    name: "Freedom",
    icon: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%230ea5e9"/><text x="50" y="68" font-family="system-ui,sans-serif" font-weight="900" font-size="58" fill="white" text-anchor="middle">F</text></svg>`,
  },
  {
    name: "Chase",
    icon: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23117aca"/><circle cx="50" cy="50" r="28" fill="none" stroke="white" stroke-width="12"/></svg>`,
  },
  {
    name: "Revolut",
    icon: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23191c1f"/><text x="50" y="68" font-family="system-ui,sans-serif" font-weight="900" font-size="58" fill="white" text-anchor="middle">R</text></svg>`,
  },
  {
    name: "Wise",
    icon: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%239fe870"/><text x="50" y="68" font-family="system-ui,sans-serif" font-weight="900" font-size="58" fill="%23163300" text-anchor="middle">W</text></svg>`,
  },
  {
    name: "T-Bank",
    icon: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23fed338"/><text x="50" y="68" font-family="system-ui,sans-serif" font-weight="900" font-size="58" fill="%23222222" text-anchor="middle">T</text></svg>`,
  },
  {
    name: "BCC",
    icon: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%2315803d"/><text x="50" y="65" font-family="system-ui,sans-serif" font-weight="900" font-size="44" fill="white" text-anchor="middle">BC</text></svg>`,
  },
];

const POPULAR_EMOJIS = ['🏦', '💳', '💰', '🪙', '💎', '📈', '🏛️', '💵', '🏢', '🏧', '💼', '🌐', '🛡️', '⚡', '⭐', '🔥'];

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("photos");
  const [search, setSearch] = useState("");
  const [uploadedGallery, setUploadedGallery] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Also query user's existing banks to populate gallery from saved data
  const { data: userBanks } = trpc.bank.list.useQuery(undefined, {
    enabled: open,
    staleTime: 60_000,
  });

  // Load uploaded icons
  useEffect(() => {
    if (!open) return;
    const localIcons = getStoredBankIcons();
    const bankList = (userBanks as Array<{ icon?: string | null }> | undefined) || [];
    const bankImageIcons = bankList
      .map((b) => b.icon)
      .filter((icon: unknown): icon is string => {
        return typeof icon === 'string' && (icon.startsWith('data:image/') || icon.startsWith('http://') || icon.startsWith('https://'));
      });

    // Merge unique
    const merged = Array.from(new Set([...localIcons, ...bankImageIcons]));
    setUploadedGallery(merged);
  }, [open, userBanks]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP, etc.)');
      return;
    }

    try {
      setIsUploading(true);
      // High quality, tiny size: 160x160 px, webp, quality 0.88 (~3-5 KB)
      const compressedDataUrl = await compressImage(file, {
        maxWidth: 160,
        maxHeight: 160,
        quality: 0.88,
        mimeType: 'image/webp',
      });

      const updated = saveStoredBankIcon(compressedDataUrl);
      setUploadedGallery(updated);
      onChange(compressedDataUrl);
      toast.success('Photo uploaded & optimized');
      setOpen(false);
    } catch (err) {
      console.error('Failed to compress image:', err);
      toast.error('Failed to process image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteUploaded = (urlToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteStoredBankIcon(urlToDelete);
    setUploadedGallery(updated);
    if (value === urlToDelete) {
      onChange('Landmark');
    }
  };

  const filteredIcons = iconNames.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const isImageValue =
    value?.startsWith('data:image/') ||
    value?.startsWith('http://') ||
    value?.startsWith('https://');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-10 px-3", className)}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md overflow-hidden bg-muted/60 border border-border/40">
              <IconDisplay icon={value} className="size-full object-cover" />
            </span>
            <span className="truncate text-sm text-foreground">
              {isImageValue ? "Custom Photo / Logo" : value ? value : "Select icon or photo..."}
            </span>
          </div>
          <span className="text-xs text-muted-foreground ml-2">Change</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[360px] p-3 dark:bg-zinc-950 border-white/10 shadow-2xl rounded-2xl" align="start">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-3 bg-muted/40">
            <TabsTrigger value="photos" className="text-xs flex items-center gap-1.5">
              <ImageIcon className="size-3.5" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="icons" className="text-xs flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              Icons
            </TabsTrigger>
            <TabsTrigger value="emojis" className="text-xs">
              Emoji
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PHOTOS & LOGOS */}
          <TabsContent value="photos" className="space-y-3 mt-0 focus-visible:outline-none">
            {/* Upload Action */}
            <div className="flex items-center gap-2">
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
                {isUploading ? "Optimizing..." : "Upload Bank Photo / Logo"}
              </Button>
            </div>

            {/* Previously Uploaded Gallery */}
            {uploadedGallery.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Uploaded Gallery
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {uploadedGallery.length} saved
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2 max-h-[110px] overflow-y-auto pr-1">
                  {uploadedGallery.map((imgUrl, i) => {
                    const isSelected = value === imgUrl;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "group relative flex size-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 p-1 transition-all hover:scale-105 hover:border-primary/60 overflow-hidden",
                          isSelected && "ring-2 ring-primary border-primary"
                        )}
                        onClick={() => {
                          onChange(imgUrl);
                          setOpen(false);
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt="uploaded"
                          className="size-full object-cover rounded-lg"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                            <Check className="size-3.5 text-white" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteUploaded(imgUrl, e)}
                          title="Remove from gallery"
                          className="absolute right-0.5 top-0.5 hidden size-4 items-center justify-center rounded-full bg-black/80 text-white/70 hover:text-red-400 group-hover:flex"
                        >
                          <Trash2 className="size-2.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Presets Grid */}
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Popular Bank Logos
              </span>
              <div className="grid grid-cols-4 gap-2">
                {BANK_PRESETS.map((preset) => {
                  const isSelected = value === preset.icon;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        onChange(preset.icon);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 p-1.5 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-primary/50 transition-all",
                        isSelected && "ring-2 ring-primary bg-primary/10 border-primary"
                      )}
                    >
                      <img
                        src={preset.icon}
                        alt={preset.name}
                        className="size-8 rounded-lg object-contain shadow-sm"
                      />
                      <span className="text-[10px] text-muted-foreground font-medium truncate max-w-full">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: LUCIDE ICONS */}
          <TabsContent value="icons" className="space-y-2 mt-0 focus-visible:outline-none">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search icon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="h-[200px] overflow-y-auto pr-1">
              <div className="grid grid-cols-5 min-[380px]:grid-cols-6 gap-1.5">
                {filteredIcons.map((iconName) => (
                  <Button
                    key={iconName}
                    type="button"
                    variant="ghost"
                    aria-label={iconName}
                    aria-pressed={value === iconName}
                    title={iconName}
                    className={cn(
                      "h-11 w-full min-w-0 touch-manipulation p-0 rounded-lg hover:bg-primary/20",
                      value === iconName && "bg-primary/20 text-primary ring-1 ring-primary"
                    )}
                    onClick={() => {
                      onChange(iconName);
                      setOpen(false);
                    }}
                  >
                    <IconDisplay icon={iconName} className="size-4" />
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: EMOJIS */}
          <TabsContent value="emojis" className="space-y-3 mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-6 gap-2">
              {POPULAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onChange(emoji);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-xl transition-all",
                    value === emoji && "ring-2 ring-primary bg-primary/20"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-white/10">
              <span className="text-[11px] text-muted-foreground block mb-1">
                Custom emoji / symbol
              </span>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste any emoji (e.g. 🏦)"
                  value={!isImageValue && !iconNames.includes(value || '') ? value || '' : ''}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
