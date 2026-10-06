// filepath: rotompc-client/src/App.jsx

import { useCallback, useEffect, useRef, useState } from "react";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

/* =========================================================
   LAYOUTS
========================================================= */

import Layout from "@/layouts/Layout";
import AuthLayout from "@/layouts/AuthLayout";
import DashLayout from "@/layouts/DashLayout";

/* =========================================================
   LANDING PAGES
========================================================= */

import HomePage from "@/pages/LandingPages/HomePage";
import AboutPage from "@/pages/LandingPages/AboutPage";
import ArticleListPage from "@/pages/LandingPages/ArticleListPage";
import ArticlePage from "@/pages/LandingPages/ArticlePage";
import RotomDexPage from "@/pages/LandingPages/RotomDexPage";
import PokemonPage from "@/pages/LandingPages/PokemonPage";

/* =========================================================
   AUTH PAGES
========================================================= */

import SignInPage from "@/pages/AuthPages/SignInPage";
import SignUpPage from "@/pages/AuthPages/SignUpPage";
import CompleteProfilePage from "@/pages/AuthPages/CompleteProfilePage";

/* =========================================================
   DASHBOARD
========================================================= */

import DashboardPage from "@/pages/DashboardPage/DashboardPage";
import ReportsPage from "@/pages/DashboardPage/ReportsPage";
import UsersPage from "@/pages/DashboardPage/UsersPage";
import DashArticleListPage from "@/pages/DashboardPage/DashArticleListPage";

/* =========================================================
   GLOBAL
========================================================= */

import NotFoundPage from "@/pages/NotFoundPage";

import RotomPCSplash from "@/components/splash/RotomPCSplash";

import { AppBootProvider } from "@/context/AppBootContext";

import useAuthSessionSync from "@/hooks/useAuthSessionSync";

import { recordWebsiteVisit } from "@/services/AnalyticsService";

/* =========================================================
   ROUTES
========================================================= */

const routes = [
  {
    path: "/",

    element: <Layout />,

    errorElement: <NotFoundPage />,

    children: [
      {
        index: true,

        element: <HomePage />,
      },

      {
        path: "about",

        element: <AboutPage />,
      },

      {
        path: "articles",

        element: <ArticleListPage />,
      },

      {
        path: "articles/:name",

        element: <ArticlePage />,
      },

      {
        path: "pokedex",

        element: <RotomDexPage />,
      },

      {
        path: "pokedex/:name",

        element: <PokemonPage />,
      },
    ],
  },

  {
    path: "/auth",

    element: <AuthLayout />,

    errorElement: <NotFoundPage />,

    children: [
      {
        path: "signin",

        element: <SignInPage />,
      },

      {
        path: "signup",

        element: <SignUpPage />,
      },

      {
        path: "complete-profile",

        element: <CompleteProfilePage />,
      },
    ],
  },

  {
    path: "/dashboard",

    element: <DashLayout />,

    errorElement: <NotFoundPage />,

    children: [
      {
        index: true,

        element: <DashboardPage />,
      },

      {
        path: "articles",

        element: <DashArticleListPage />,
      },

      {
        path: "reports",

        element: <ReportsPage />,
      },

      {
        path: "users",

        element: <UsersPage />,
      },
    ],
  },
];

/* =========================================================
   ROUTER
========================================================= */

const router = createBrowserRouter(routes);

/* =========================================================
   APP
========================================================= */

function App() {
  const [splashVisible, setSplashVisible] = useState(true);

  const lastTrackedPathRef = useRef("");

  /* =======================================================
     AUTH SESSION
  ======================================================= */

  useAuthSessionSync();

  /* =======================================================
     WEBSITE VISIT TRACKING

     Records:
     - initial page
     - subsequent SPA route changes

     Does NOT send:
     - query strings
     - URL hashes
     - email
     - username
     - page contents
  ======================================================= */

  useEffect(() => {
    const trackLocation = (location) => {
      const pathname = String(location?.pathname || "/");

      /*
       * Prevent duplicate router notifications in
       * the same mounted App instance.
       */
      if (lastTrackedPathRef.current === pathname) {
        return;
      }

      lastTrackedPathRef.current = pathname;

      /*
       * Analytics must never interrupt navigation.
       */
      recordWebsiteVisit(pathname).catch((error) => {
        if (import.meta.env.DEV) {
          console.warn("Website visit tracking unavailable:", error?.message);
        }
      });
    };

    /*
     * Track the first route.
     */
    trackLocation(router.state.location);

    /*
     * Track future navigation.
     */
    const unsubscribe = router.subscribe((state) => {
      trackLocation(state.location);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  /* =======================================================
     APP READY
  ======================================================= */

  const appReady = !splashVisible;

  /* =======================================================
     SPLASH FINISH
  ======================================================= */

  const handleSplashFinish = useCallback(() => {
    setSplashVisible(false);
  }, []);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppBootProvider appReady={appReady} splashVisible={splashVisible}>
      <RouterProvider router={router} />

      {splashVisible && <RotomPCSplash onFinish={handleSplashFinish} />}
    </AppBootProvider>
  );
}

export default App;
