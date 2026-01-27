export function debounce<T extends (...args: any[]) => void>(fn: T, wait = 250) {
    let t: number | undefined;
    return (...args: Parameters<T>) => {
        globalThis.clearTimeout(t);
        t = globalThis.setTimeout(() => fn(...args), wait);
    };
}
