// Preserve only scope; each destination owns its other filters.
export const retainFinanceView = (previous: { view?: 'personal' }) => ({
    view: previous.view,
});
