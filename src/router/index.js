import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/Home.vue')
    },
    {
        path: '/converter',
        name: 'Converter',
        component: () => import('../views/Converter.vue')
    },
    {
        path: '/shortlink',
        name: 'ShortLink',
        component: () => import('../views/ShortLink.vue')
    },
    {
        path: '/about',
        name: 'About',
        component: () => import('../views/About.vue')
    },
    {
        path: '/health',
        name: 'HealthCheck',
        component: () => import('../views/HealthCheck.vue')
    },
    {
        path: '/merge',
        name: 'Merge',
        component: () => import('../views/Merge.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

export default router
