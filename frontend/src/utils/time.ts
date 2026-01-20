export function formatRelativeDate(date: string) {
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

    const day = 86400;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;

    if (diff < day) return "Today";
    if (diff < day * 2) return "Yesterday";
    if (diff < week) return "This week";
    if (diff < week * 2) return "Last week";
    if (diff < month) return "This month";
    if (diff < month * 2) return "Last month";
    if (diff < year) return "This year";

    return "A year ago";
}


/**
 * Format ISO date string into human readable format
 * Example:
 *  "2026-02-02T03:14:00.000Z"
 *    -> "02 Feb 2026, 10:14"
 */
export function formatDateTime(
    iso: string | null | undefined,
    options?: {
        withTime?: boolean;
        locale?: string;
    }
): string {
    if (!iso) return "-";

    const { withTime = true, locale = "en-US" } = options || {};

    const date = new Date(iso);
    if (isNaN(date.getTime())) return "-";

    const datePart = date.toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    if (!withTime) return datePart;

    const timePart = date.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

    return `${datePart}, ${timePart}`;
}
