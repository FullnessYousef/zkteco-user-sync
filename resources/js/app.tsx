import { type ReactNode } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import AppLayout from '@/layouts/app-layout';

createInertiaApp({
    title: (title) => (title ? `${title} · ZKTeco User Sync` : 'ZKTeco User Sync'),
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx', { eager: true });
        const page = pages[`./pages/${name}.tsx`] as { default: { layout?: unknown } };

        if (!page) {
            throw new Error(`Inertia page not found: ./pages/${name}.tsx`);
        }

        page.default.layout =
            page.default.layout ?? ((content: ReactNode) => <AppLayout>{content}</AppLayout>);

        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#171717',
    },
});
