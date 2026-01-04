import { reactive } from "vue";

export type ToastType = "success" | "error" | "info";

export interface Toast {
    id: number;
    type: ToastType;
    message: string;
    timeout?: number;
}

const state = reactive({
    toasts: [] as Toast[],
    seed: 0
});

export const toastStore = {
    show(
        message: string,
        type: ToastType = "info",
        timeout = 3000
    ) {
        const id = ++state.seed;
        state.toasts.push({ id, type, message, timeout });

        if (timeout > 0) {
            setTimeout(() => {
                this.remove(id);
            }, timeout);
        }
    },

    remove(id: number) {
        state.toasts = state.toasts.filter(t => t.id !== id);
    },

    state
};
