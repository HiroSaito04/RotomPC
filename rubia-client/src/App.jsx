import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// HomePage Structure
//LabAct02
import Layout from './layouts/Layout';
import ArticlePage from './pages/LandingPages/ArticlePage';
import HomePage from './pages/LandingPages/HomePage';
import AboutPage from './pages/LandingPages/AboutPage';

//LabAct3
import ArticleListPage from './pages/LandingPages/ArticleListPage';
import NotFoundPage from './pages/NotFoundPage';

//LabAct4
import AuthLayout from './layouts/AuthLayout';
import SignInPage from './pages/AuthPages/SignInPage';
import SignUpPage from './pages/AuthPages/SignUpPage';

//LabAct4-5
import DashLayout from './layouts/DashLayout';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import ReportsPage from './pages/DashboardPage/ReportsPage';
import UsersPage from './pages/DashboardPage/UsersPage';

//LabAct6
import DashArticleListPage from './pages/DashboardPage/DashArticleListPage';

//RotomDex
import RotomDexPage from './pages/LandingPages/RotomDexPage';
import PokemonPage from './pages/LandingPages/PokemonPage';

const routes = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: '',
        element: <HomePage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
      {
        path: 'articles',
        element: <ArticleListPage />,
      },
      {
        path: 'articles/:name',
        element: <ArticlePage />,
      },
      {
        path: 'pokedex',
        element: <RotomDexPage />,
      },
      {
        path: 'pokedex/:name',
        element: <PokemonPage />,
      },
    ],
  },
{
  path: 'auth/',
    element: <AuthLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: 'signin',
        element: <SignInPage />,
      },
      {
        path: 'signup',
        element: <SignUpPage />,
      },
    ],
  },
  {
   path: 'dashboard/',
    element: <DashLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: '',
        element: <DashboardPage />,
      },
      {
        path: 'articles',
        element: <DashArticleListPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
    ],
  }
];

const router = createBrowserRouter(routes);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;