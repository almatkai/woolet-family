import { useTheme } from '@/components/theme-provider';
import { Toaster as Sonner } from 'sonner';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, Loader2 } from 'lucide-react';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'dark' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="size-4.5 text-emerald-400 shrink-0" />,
        error: <AlertCircle className="size-4.5 text-rose-400 shrink-0" />,
        warning: <AlertTriangle className="size-4.5 text-amber-400 shrink-0" />,
        info: <Info className="size-4.5 text-violet-400 shrink-0" />,
        loading: <Loader2 className="size-4.5 text-violet-400 animate-spin shrink-0" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-zinc-950/95 dark:group-[.toaster]:bg-zinc-950/95 group-[.toaster]:text-zinc-100 group-[.toaster]:border-white/10 group-[.toaster]:backdrop-blur-xl group-[.toaster]:shadow-[0_16px_40px_rgba(0,0,0,0.6)] group-[.toaster]:rounded-2xl group-[.toaster]:p-3.5 group-[.toaster]:gap-3 group-[.toaster]:text-sm group-[.toaster]:font-medium',
          title: 'group-[.toast]:text-zinc-100 group-[.toast]:font-semibold group-[.toast]:text-sm',
          description: 'group-[.toast]:text-zinc-400 group-[.toast]:text-xs',
          actionButton:
            'group-[.toast]:!bg-gradient-to-r group-[.toast]:!from-violet-600 group-[.toast]:!to-indigo-600 hover:group-[.toast]:!from-violet-500 hover:group-[.toast]:!to-indigo-500 group-[.toast]:!text-white group-[.toast]:!font-medium group-[.toast]:!text-xs group-[.toast]:!px-3 group-[.toast]:!py-1.5 group-[.toast]:!rounded-xl group-[.toast]:!shadow-sm transition-all',
          cancelButton:
            'group-[.toast]:!bg-white/10 hover:group-[.toast]:!bg-white/15 group-[.toast]:!text-zinc-200 group-[.toast]:!font-medium group-[.toast]:!text-xs group-[.toast]:!px-3 group-[.toast]:!py-1.5 group-[.toast]:!rounded-xl transition-all',
          closeButton:
            'group-[.toast]:!border group-[.toast]:!border-white/10 group-[.toast]:!bg-zinc-900/90 hover:group-[.toast]:!bg-white/15 group-[.toast]:!text-zinc-400 hover:group-[.toast]:!text-zinc-100 group-[.toast]:!rounded-full group-[.toast]:!size-6 group-[.toast]:!top-2.5 group-[.toast]:!right-2.5 group-[.toast]:!left-auto group-[.toast]:!transform-none group-[.toast]:!opacity-80 hover:group-[.toast]:!opacity-100 transition-all',
          error:
            'group-[.toast]:!border-rose-500/30 group-[.toast]:!bg-[radial-gradient(120%_40%_at_0%_0%,rgba(244,63,94,0.18),transparent_70%),rgba(9,9,11,0.95)] group-[.toast]:!text-rose-100 group-[.toast]:shadow-[0_16px_40px_rgba(244,63,94,0.18)]',
          success:
            'group-[.toast]:!border-emerald-500/30 group-[.toast]:!bg-[radial-gradient(120%_40%_at_0%_0%,rgba(16,185,129,0.18),transparent_70%),rgba(9,9,11,0.95)] group-[.toast]:!text-emerald-100 group-[.toast]:shadow-[0_16px_40px_rgba(16,185,129,0.18)]',
          warning:
            'group-[.toast]:!border-amber-500/30 group-[.toast]:!bg-[radial-gradient(120%_40%_at_0%_0%,rgba(245,158,11,0.18),transparent_70%),rgba(9,9,11,0.95)] group-[.toast]:!text-amber-100 group-[.toast]:shadow-[0_16px_40px_rgba(245,158,11,0.18)]',
          info:
            'group-[.toast]:!border-violet-500/30 group-[.toast]:!bg-[radial-gradient(120%_40%_at_0%_0%,rgba(139,92,246,0.18),transparent_70%),rgba(9,9,11,0.95)] group-[.toast]:!text-violet-100 group-[.toast]:shadow-[0_16px_40px_rgba(139,92,246,0.18)]',
        },
      }}
      {...props}
    />
  );
}
