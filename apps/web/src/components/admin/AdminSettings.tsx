import React from 'react';
import { useTheme, type Theme } from '@/components/theme-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Sun, Moon, Zap, CheckCircle2 } from 'lucide-react';

export default function AdminSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Sun className="h-6 w-6 text-primary" />
          Settings
        </h2>
        <p className="text-muted-foreground mt-1">Appearance and infrastructure information.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Theme Settings
          </CardTitle>
          <CardDescription>Choose how Woolet looks on your device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { id: 'light', label: 'Light', icon: Sun, color: 'text-amber-500', bg: 'bg-white' },
              { id: 'dark', label: 'Dark', icon: Moon, color: 'text-blue-400', bg: 'bg-slate-900' },
              { id: 'system', label: 'System', icon: Monitor, color: 'text-slate-500', bg: 'bg-muted' },
              { id: 'super-dark', label: 'OLED', icon: Zap, color: 'text-purple-500', bg: 'bg-black' },
            ].map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setTheme(t.id as Theme)}
                className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 ${theme === t.id ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20' : 'border-transparent bg-muted/40 hover:bg-muted/60'}`}
              >
                <div className={`h-12 w-12 rounded-full ${t.bg} border shadow-sm flex items-center justify-center`}>
                  <t.icon className={`h-6 w-6 ${t.color}`} />
                </div>
                <span className="text-sm font-semibold">{t.label}</span>
                {theme === t.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="h-4 w-4 text-primary fill-primary/10" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="pt-6 border-t">
            <h4 className="text-sm font-semibold mb-4 text-foreground">Infrastructure Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30 border border-dashed">
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Version</p>
                <p className="text-sm font-mono mt-1">v1.2.4-stable</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-dashed">
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Mode</p>
                <p className="text-sm font-mono mt-1 text-primary">{import.meta.env.MODE.toUpperCase()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
