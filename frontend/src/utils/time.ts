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
