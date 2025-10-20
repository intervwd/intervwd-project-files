import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "LoginPage",
    component: () => import("@/views/MainLandingPages/LoginPage.vue"),
  },
  {
    path: "/LandingPage",
    name: "LandingPage",
    component: () => import("../views/MainLandingPages/LandingPage.vue"),
    children: [
      {
        path: "/Dashboard",
        name: "Dashboard",
        component: () => import("@/views/ChildHomePages/MainProfilePage.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
