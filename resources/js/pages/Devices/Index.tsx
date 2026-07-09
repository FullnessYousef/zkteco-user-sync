import { type FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Device } from '@/types';

interface Props {
    devices: Device[];
}

interface DeviceForm {
    name: string;
    ip_address: string;
    port: number | string;
    comm_key: number | string;
    notes: string;
}

const EMPTY_FORM: DeviceForm = { name: '', ip_address: '', port: 4370, comm_key: '', notes: '' };

export default function DevicesIndex({ devices }: Props) {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [testingId, setTestingId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form, setForm] = useState<DeviceForm>(EMPTY_FORM);

    const set = <K extends keyof DeviceForm>(key: K, value: DeviceForm[K]) =>
        setForm((current) => ({ ...current, [key]: value }));

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setErrors({});
        setOpen(true);
    };

    const openEdit = (device: Device) => {
        setEditingId(device.id);
        setForm({
            name: device.name,
            ip_address: device.ip_address,
            port: device.port,
            comm_key: device.comm_key ?? '',
            notes: device.notes ?? '',
        });
        setErrors({});
        setOpen(true);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onError: (formErrors: Record<string, string>) => setErrors(formErrors),
            onSuccess: () => setOpen(false),
        };

        if (editingId) {
            router.put(`/devices/${editingId}`, form, options);
        } else {
            router.post('/devices', form, options);
        }
    };

    const remove = (device: Device) => {
        if (!window.confirm(`Remove device "${device.name}"?`)) {
            return;
        }

        router.delete(`/devices/${device.id}`, { preserveScroll: true });
    };

    const test = (device: Device) => {
        setTestingId(device.id);
        router.post(`/devices/${device.id}/test`, {}, {
            preserveScroll: true,
            onFinish: () => setTestingId(null),
        });
    };

    const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : 'Never');

    return (
        <>
            <Head title="Devices" />

            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Devices</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        ZKTeco terminals reachable on your local network (default port 4370).
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="size-4" />
                    Add device
                </Button>
            </header>

            {devices.length === 0 ? (
                <div className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
                    No devices yet. Add your first ZKTeco terminal to start syncing.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {devices.map((device) => (
                        <Card key={device.id} className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-base font-semibold">{device.name}</h3>
                                    <p className="mt-0.5 font-mono text-sm text-muted-foreground">
                                        {device.ip_address}:{device.port}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
                                        device.last_connection_ok
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-muted text-muted-foreground',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'size-1.5 rounded-full',
                                            device.last_connection_ok ? 'bg-emerald-500' : 'bg-muted-foreground',
                                        )}
                                    />
                                    {device.last_connection_ok ? 'Online' : 'Unknown'}
                                </span>
                            </div>

                            <dl className="mt-4 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Serial</dt>
                                    <dd>{device.serial_number ?? '—'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Comm key</dt>
                                    <dd>{device.comm_key ?? 'None'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Last checked</dt>
                                    <dd>{formatDate(device.last_connected_at)}</dd>
                                </div>
                            </dl>

                            <div className="mt-5 flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    disabled={testingId === device.id}
                                    onClick={() => test(device)}
                                >
                                    {testingId === device.id ? 'Testing…' : 'Test connection'}
                                </Button>
                                <Button variant="outline" onClick={() => openEdit(device)}>
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => remove(device)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit device' : 'Add device'}</DialogTitle>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={submit}>
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={form.name}
                                placeholder="Front door terminal"
                                onChange={(event) => set('name', event.target.value)}
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-1.5">
                                <Label htmlFor="ip">IP address</Label>
                                <Input
                                    id="ip"
                                    value={form.ip_address}
                                    placeholder="192.168.1.201"
                                    className="font-mono"
                                    onChange={(event) => set('ip_address', event.target.value)}
                                />
                                {errors.ip_address && <p className="text-xs text-destructive">{errors.ip_address}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="port">Port</Label>
                                <Input
                                    id="port"
                                    type="number"
                                    value={form.port}
                                    onChange={(event) => set('port', event.target.value)}
                                />
                                {errors.port && <p className="text-xs text-destructive">{errors.port}</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="comm_key">
                                Communication key <span className="text-muted-foreground">(optional)</span>
                            </Label>
                            <Input
                                id="comm_key"
                                type="number"
                                value={form.comm_key}
                                placeholder="Leave blank if the device has none"
                                onChange={(event) => set('comm_key', event.target.value)}
                            />
                            {errors.comm_key && <p className="text-xs text-destructive">{errors.comm_key}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="notes">
                                Notes <span className="text-muted-foreground">(optional)</span>
                            </Label>
                            <Textarea id="notes" rows={2} value={form.notes} onChange={(event) => set('notes', event.target.value)} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving…' : 'Save device'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
