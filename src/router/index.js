import Vue from "vue";
import VueRouter from "vue-router";
import NProgress from "nprogress";
import Overview from "../views/Overview.vue";
import NotFound from "../views/NotFound.vue";
import NetworkIssue from "../views/NetworkIssue.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "overview",
    component: Overview
  },
  {
    path: "/warnings",
    name: "warnings",
    component: () => import(/* webpackChunkName: "about" */ "../views/Warnings.vue")
  },
  {
    path: "/people",
    name: "people",
    component: () => import(/* webpackChunkName: "about" */ "../views/People.vue")
  },
  {
    path: "/families",
    name: "families",
    component: () => import(/* webpackChunkName: "about" */ "../views/Families.vue")
  },
  {
    path: "/places",
    name: "places",
    component: () => import(/* webpackChunkName: "about" */ "../views/Places.vue")
  },
  {
    path: "/sources",
    name: "sources",
    component: () => import(/* webpackChunkName: "about" */ "../views/Sources.vue")
  },
  {
    path: "/matches",
    name: "matches",
    component: () => import(/* webpackChunkName: "about" */ "../views/Matches.vue")
  },
  {
    path: "/import",
    name: "import",
    meta: { requiresAuth: true },
    component: () => import(/* webpackChunkName: "about" */ "../views/Import.vue")
  },
  {
    path: "/404",
    name: "404",
    component: NotFound,
    props: true
  },
  {
    path: "/network-issue",
    name: "network-issue",
    component: NetworkIssue
  },
  {
    path: "*",
    redirect: { name: "404", params: { resource: "page" } }
  }
];

const router = new VueRouter({
  mode: "hash",
  routes
});

router.beforeEach((routeTo, routeFrom, next) => {
  NProgress.start();
  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
