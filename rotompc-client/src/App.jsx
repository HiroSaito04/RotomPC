// rotompc-client/src/App.jsx

import { useCallback, useState } from "react";

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
   DASHBOARD PAGES
========================================================= */

import DashboardPage from "@/pages/DashboardPage/DashboardPage";

import ReportsPage from "@/pages/DashboardPage/ReportsPage";

import UsersPage from "@/pages/DashboardPage/UsersPage";

import DashArticleListPage from "@/pages/DashboardPage/DashArticleListPage";

/* =========================================================
   OTHER
========================================================= */

import NotFoundPage from "@/pages/NotFoundPage";

import RotomPCSplash from "@/components/splash/RotomPCSplash";

/* =========================================================
   ROUTES
========================================================= */

const routes = [
  /* =======================================================
     LANDING
  ======================================================= */

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

  /* =======================================================
     AUTH
  ======================================================= */

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

  /* =======================================================
     DASHBOARD
  ======================================================= */

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

  /* =======================================================
     SPLASH COMPLETE
  ======================================================= */

  const handleSplashFinish = useCallback(() => {
    setSplashVisible(false);
  }, []);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      {/*
       * Router mounts immediately.
       *
       * This lets the actual page initialize
       * behind the splash screen.
       */}

      <RouterProvider router={router} />

      {/*
       * Splash is simply a temporary overlay.
       */}

      {splashVisible && <RotomPCSplash onFinish={handleSplashFinish} />}
    </>
  );
}

export default App;
