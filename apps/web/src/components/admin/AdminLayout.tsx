import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { ShieldCheck, Bot, KeyRound, Database, Settings, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { to: '/admin/config', label: 'AI Config', icon: Bot },
  { to: '/admin/providers', label: 'Providers', icon: KeyRound },
  { to: '/admin/models', label: 'Models', icon: Database },
  { to: '/admin/chat', label: 'Chat', icon: Zap },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: isAdmin, isLoading: loadingAdmin } = trpc.user.isAdmin.useQuery();

  if (loadingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <ShieldCheck className="h-16 w-16 text-destructive/50" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          You do not have administrative privileges to access this area.
          Please contact the system administrator if you believe this is an error.
        </p>
        <Button onClick={() => navigate({ to: '/' })}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 p-1 md:p-6">
      <aside className="md:w-56 shrink-0">
        <div className="md:sticky md:top-6 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">System configuration</p>
            </div>
          </div>
          <nav className="flex md:flex-col gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
