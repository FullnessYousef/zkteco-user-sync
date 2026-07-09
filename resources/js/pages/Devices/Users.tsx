import { type FormEvent, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Cpu, MonitorSmartphone, Pencil, RefreshCw, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConnectingDots } from '@/components/connecting-dots';
import { DataStream } from '@/components/data-stream';
import { cn } from '@/lib/utils';

interface DeviceUser {
    uid: number;
    user_id: string;
    name: string;
    role: number;
    role_label: string;
    password: string;
    card_no: string | null;
}

interface Props {
    device: { id: number; name: string; ip_address: string; port: number };
    result: { ok: boolean; error?: string; users: DeviceUser[]; count: number };
}

interface UserForm {
    user_id: string;
    name: string;
    password: string;
    card_number: string;
    privilege: string;
}

export default function DevicesUsers({ device, result }: Props) {
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingUid, setEditingUid] = useState<number | null>(null);
    const [form, setForm] = useState<UserForm>({ user_id: '', name: '', password: '', card_number: '', privilege: 'user' });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [deletingUid, setDeletingUid] = useState<number | null>(null);

    const set = <K extends keyof UserForm>(key: K, value: UserForm[K]) =>
        setForm((current) => ({ ...current, [key]: value }));

    const refresh = () => {
        router.reload({ onStart: () => setRefreshing(true), onFinish: () => setRefreshing(false) });
    };

    const openEdit = (user: DeviceUser) => {
        setEditingUid(user.uid);
        setForm({
            user_id: user.user_id,
            name: user.name,
            password: user.password ?? '',
            card_number: user.card_no ?? '',
            privilege: user.role === 14 ? 'admin' : 'user',
        });
        setFormErrors({});
        setEditOpen(true);
    };

    const submitEdit = (event: FormEvent) => {
        event.preventDefault();

        router.put(`/devices/${device.id}/users/${editingUid}`, form, {
            preserveScroll: true,
            onStart: () => {
                setSaving(true);
                setBusy(true);
            },
            onFinish: () => {
                setSaving(false);
                setBusy(false);
            },
            onError: (errors) => setFormErrors(errors),
            onSuccess: () => setEditOpen(false),
        });
    };

    const remove = (user: DeviceUser) => {
        if (!window.confirm(`Remove "${user.name || user.user_id}" from ${device.name}?`)) {
            return;
        }

        router.delete(`/devices/${device.id}/users/${user.uid}`, {
            preserveScroll: true,
            onStart: () => {
                setDeletingUid(user.uid);
                setBusy(true);
            },
            onFinish: () => {
                setDeletingUid(null);
                setBusy(false);
            },
        });
    };

    const clearAll = () => {
        if (!window.confirm(`Remove ALL ${result.count} users from ${device.name}? This cannot be undone.`)) {
            return;
        }

        router.delete(`/devices/${device.id}/users`, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <>
            <Head title={`Users on ${device.name}`} />

            <div className="mb-6">
                <Link href="/devices" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" /> Devices
                </Link>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{device.name}</h1>
                        <p className="mt-1 font-mono text-sm text-muted-foreground">
                            {device.ip_address}:{device.port}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {result.ok && result.users.length > 0 && (
                            <Button variant="outline" className="text-destructive hover:text-destructive" disabled={busy} onClick={clearAll}>
                                <Trash2 className="size-4" /> Remove all
                            </Button>
                        )}
                        <Button variant="outline" onClick={refresh} disabled={refreshing || busy}>
                            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
                            {refreshing ? 'Reading…' : 'Refresh'}
                        </Button>
                    </div>
                </div>
            </div>

            {refreshing && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border bg-secondary/40 px-4 py-2.5">
                    <Cpu className="size-4 shrink-0 text-muted-foreground" />
                    <DataStream direction="to-app" active className="max-w-[140px]" />
                    <MonitorSmartphone className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Reading users from device…</span>
                </div>
            )}

            {busy && !refreshing && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border bg-secondary/40 px-4 py-2.5">
                    <MonitorSmartphone className="size-4 shrink-0 text-muted-foreground" />
                    <DataStream direction="to-device" active className="max-w-[140px]" />
                    <Cpu className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Writing to device…</span>
                </div>
            )}

            {!result.ok ? (
                <Card className="p-8 text-center">
                    <p className="text-sm font-medium text-destructive">{result.error ?? 'Could not read the device.'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Make sure the terminal is powered on and on this network, then Refresh.
                    </p>
                </Card>
            ) : result.users.length === 0 ? (
                <Card className="p-12 text-center text-sm text-muted-foreground">No users are stored on this device yet.</Card>
            ) : (
                <>
                    <p className="mb-3 text-sm text-muted-foreground">
                        {result.count} user{result.count === 1 ? '' : 's'} currently on the device
                    </p>
                    <Card className="overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Slot</TableHead>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>PIN</TableHead>
                                    <TableHead>Card</TableHead>
                                    <TableHead className="text-right">Edit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.users.map((user) => (
                                    <TableRow key={user.uid}>
                                        <TableCell className="text-muted-foreground">{user.uid}</TableCell>
                                        <TableCell className="font-mono">{user.user_id || '—'}</TableCell>
                                        <TableCell>{user.name || '—'}</TableCell>
                                        <TableCell>
                                            {user.role === 14 ? (
                                                <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-700">
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">{user.role_label}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-muted-foreground">{user.password || '—'}</TableCell>
                                        <TableCell className="font-mono text-muted-foreground">{user.card_no ?? '—'}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="size-8" disabled={busy} onClick={() => openEdit(user)}>
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-muted-foreground hover:text-destructive"
                                                    disabled={busy}
                                                    onClick={() => remove(user)}
                                                >
                                                    {deletingUid === user.uid ? <ConnectingDots /> : <Trash2 className="size-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </>
            )}

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit user on device</DialogTitle>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={submitEdit}>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="user_id">User ID</Label>
                                <Input id="user_id" value={form.user_id} className="font-mono" onChange={(event) => set('user_id', event.target.value)} />
                                {formErrors.user_id && <p className="text-xs text-destructive">{formErrors.user_id}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="privilege">Role</Label>
                                <Select value={form.privilege} onValueChange={(value) => set('privilege', value)}>
                                    <SelectTrigger id="privilege">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={form.name} onChange={(event) => set('name', event.target.value)} />
                            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="password">PIN <span className="text-muted-foreground">(optional)</span></Label>
                                <Input id="password" value={form.password} className="font-mono" onChange={(event) => set('password', event.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="card_number">Card <span className="text-muted-foreground">(optional)</span></Label>
                                <Input id="card_number" value={form.card_number} className="font-mono" onChange={(event) => set('card_number', event.target.value)} />
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Saving writes the change to slot {editingUid} on the device. Non-ASCII names are auto-converted;
                            user id ≤ 9 digits, PIN ≤ 8 digits.
                        </p>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? (
                                    <span className="inline-flex items-center gap-1.5">
                                        <ConnectingDots /> Saving
                                    </span>
                                ) : (
                                    'Save to device'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
