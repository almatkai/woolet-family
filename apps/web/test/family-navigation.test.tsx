import { expect, test } from 'bun:test';
import React from 'react';
import { retainFinanceView } from '../src/lib/finance-navigation';
import { renderToString } from 'react-dom/server';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Link, Outlet, retainSearchParams, RouterProvider } from '@tanstack/react-router';

for (const target of ['/accounts', '/spending', '/financial/credits', '/family', '/settings']) {
    test(`navigation renders ${target} with the current Personal scope`, async () => {
        const root = createRootRoute({
            validateSearch: (search: Record<string, unknown>) => ({ view: search.view === 'personal' ? 'personal' : undefined }),
            search: { middlewares: [retainSearchParams(['view'])] },
            component: () => <><Link to={target} search={retainFinanceView}>Destination</Link><Outlet /></>,
        });
        const routes = ['/', target].map(path => createRoute({ getParentRoute: () => root, path, component: () => null }));
        const router = createRouter({ routeTree: root.addChildren(routes), history: createMemoryHistory({ initialEntries: ['/?view=personal'] }) });
        await router.load();
        const html = renderToString(<RouterProvider router={router} />);
        expect(html).toContain(`href="${target}?view=personal"`);
    });
}
