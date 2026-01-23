export function formatHuman(iso: string | null | undefined, locale = "en-US") {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;

    return new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(d);
}

export type DeadlineState = "OVERDUE" | "DUE_TODAY" | "DUE_SOON" | "OK" | "NO_DUE_DATE";

export function computeDeadline(dueIso: string | null | undefined) {
    if (!dueIso) return { dueDateHuman: null, deadlineState: "NO_DUE_DATE" as DeadlineState, deadlineDays: null as number | null };

    const due = new Date(dueIso);
    if (isNaN(due.getTime())) {
        return { dueDateHuman: null, deadlineState: "NO_DUE_DATE" as DeadlineState, deadlineDays: null as number | null };
    }

    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // days remaining

    const dueDateHuman = formatHuman(dueIso);

    if (diffMs < 0) {
        return { dueDateHuman, deadlineState: "OVERDUE" as DeadlineState, deadlineDays: Math.abs(diffDays) };
    }
    if (diffDays === 0) {
        return { dueDateHuman, deadlineState: "DUE_TODAY" as DeadlineState, deadlineDays: 0 };
    }
    if (diffDays <= 3) {
        return { dueDateHuman, deadlineState: "DUE_SOON" as DeadlineState, deadlineDays: diffDays };
    }
    return { dueDateHuman, deadlineState: "OK" as DeadlineState, deadlineDays: diffDays };
}
