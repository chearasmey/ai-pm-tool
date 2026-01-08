import { UserRoleEnum } from "../types/role";

export const routes = [
    {
        path: "/",
        component: () => import("../pages/Dashboard.vue"),
        meta: { requiresAuth: true, layout: "main" }
    },
    {
        path: "/login",
        component: () => import("../pages/Login.vue"),
        meta: {
            publicOnly: true,
            layout: "auth"
        }
    },

    {
        path: "/users",
        component: () => import("../pages/User.vue"),
        meta: {
            requiresAuth: true,
            roles: [UserRoleEnum.SYSTEM_ADMIN],
            layout: "main"
        }
    },

    {
        path: "/starred",
        component: () => import("../pages/Starred.vue"),
        meta: {
            requiresAuth: true,
            layout: "main"
        }
    },
    {
        path: "/scrum",
        meta: { requiresAuth: true, layout: "main" },
        children: [
            {
                path: "",
                component: () => import("../pages/Scrum.vue")
            },
            {
                path: "create",
                component: () => import("../pages/CreateProject.vue"),
                props: { type: "scrum" }
            },
            {
                path: "project/:key",
                component: () => import("../pages/UpdateProject.vue"),
                props: { type: "scrum" }
            },
            {
                path: "board/:key",
                component: () => import("../pages/ScrumBoard.vue"),
            },
            {
                path: "board/:key/people",
                component: () => import("../pages/ScrumPeople.vue"),
            }
        ]
    },
    {
        path: "/kanban",
        meta: { requiresAuth: true, layout: "main" },
        children: [
            {
                path: "",
                component: () => import("../pages/Kanban.vue")
            },
            {
                path: "create",
                component: () => import("../pages/CreateProject.vue"),
                props: { type: "kanban" }
            },
            {
                path: "project/:key",
                component: () => import("../pages/UpdateProject.vue"),
                props: { type: "kanban" }
            },
            {
                path: "board/:key",
                component: () => import("../pages/KanbanBoard.vue"),
            },
            {
                path: "board/:key/people",
                component: () => import("../pages/KanbanPeople.vue"),
            }
        ]
    },
    {
        path: "/settings",
        component: () => import("../pages/Setting.vue"),
        meta: {
            requiresAuth: true,
            layout: "main"
        }
    },
    {
        path: "/403",
        component: () => import("../pages/Forbidden.vue"),
        meta: { layout: "main" }
    }

];
