import { format, isToday, isYesterday, parseISO } from 'date-fns';

export function formatDay(value: string, relative = false) {
    const date = parseISO(value.slice(0, 10));
    if (relative && isToday(date)) return 'Today';
    if (relative && isYesterday(date)) return 'Yesterday';
    return format(
        date,
        date.getFullYear() === new Date().getFullYear()
            ? 'MMM d'
            : 'MMM d, yyyy',
    );
}
