/** Auth provider IDs are identifiers, never a useful fallback for a person's name. */
export function householdDisplayName(name: string | null | undefined, email: string | null | undefined): string {
    const display = name?.trim();
    if (display && !/^user_[a-z0-9]+$/i.test(display)) return display;
    const alias = email?.split('@')[0]?.trim();
    return alias && !/^user_[a-z0-9]+$/i.test(alias) ? alias : 'Family member';
}
