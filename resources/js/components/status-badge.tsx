import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<string, string> = {
    parsed: 'bg-muted text-muted-foreground',
    pending: 'bg-muted text-muted-foreground',
    syncing: 'bg-blue-100 text-blue-700',
    synced: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-rose-100 text-rose-700',
    skipped: 'bg-amber-100 text-amber-700',
};

export function StatusBadge({ status }: { status: string }) {
    const classes = STATUS_CLASSES[status] ?? 'bg-muted text-muted-foreground';
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '—';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
                classes,
            )}
        >
            {status === 'syncing' && <span className="size-1.5 animate-pulse rounded-full bg-blue-500" />}
            {label}
        </span>
    );
}
