import { type ReactNode, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Monitor, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

const NAVIGATION = [
    { label: 'Imports', href: '/', icon: Upload, isActive: (path: string) => path === '/' || path.startsWith('/import') },
    { label: 'Devices', href: '/devices', icon: Monitor, isActive: (path: string) => path.startsWith('/devices') },
];

export default function AppLayout({ children }: { children: ReactNode }) {
    const page = usePage<SharedPageProps>();
    const currentPath = page.url.split('?')[0];
    const flash = page.props.flash;
    const version = page.props.app?.version ?? '';

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        } else if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    return (
        <div className="flex min-h-screen">
            <aside className="hidden w-60 shrink-0 flex-col border-r bg-card px-4 py-6 sm:flex">
                <div className="flex items-center gap-2 px-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Monitor className="size-5" />
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-semibold">ZKTeco</p>
                        <p className="text-xs text-muted-foreground">User Sync</p>
                    </div>
                </div>

                <nav className="mt-8 flex flex-col gap-1">
                    {NAVIGATION.map((item) => {
                        const active = item.isActive(currentPath);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    active
                                        ? 'bg-secondary text-secondary-foreground'
                                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                                )}
                            >
                                <Icon className="size-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto px-2 text-xs text-muted-foreground">v{version}</div>
            </aside>

            <div className="flex min-h-screen flex-1 flex-col">
                <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
            </div>

            <Toaster position="bottom-right" richColors />
        </div>
    );
}
