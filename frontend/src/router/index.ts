import { createRouter, createWebHistory } from "vue-router";
import { routes } from "./routes";
import { useAuthStore } from "../stores/auth.store";

const router = createRouter({
    history: createWebHistory(),
    routes
});

let isAuthenticated = false;

router.beforeEach(async (to) => {
    const auth = useAuthStore();

    // ⏳ WAIT until auth state is known
    if (!auth.isInitialized) {
        await auth.refresh();
    }
    // 🔁 prevent login page after auth
    if (to.meta.publicOnly && auth.isAuthenticated) {
        return "/";
    }

    // refresh token only for protected routes
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        if (!isAuthenticated) {
            isAuthenticated = true;
            try {
                await auth.refresh();
            } catch {
                await auth.logout();
                return '/login';
            }
        }
    }

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        return {
            path: '/login',
            query: { redirect: to.fullPath }
        }
    }

    if (to.meta.roles && !(to.meta.roles as string[]).includes(auth.user?.role as string)) {
        return "/403";
    }
});

export default router;
