import { createBrowserRouter, Navigate } from "react-router-dom";

import App from "../App";
import GuestRoute from "../components/auth/GuestRoute";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AppLayout from "../layouts/AppLayout";
import ActivityPage from "../pages/app/ActivityPage";
import DecisionDetailPage from "../pages/app/DecisionDetailPage";
import DecisionsPage from "../pages/app/DecisionsPage";
import GraphPage from "../pages/app/GraphPage";
import MembersPage from "../pages/app/MembersPage";
import OverviewPage from "../pages/app/OverviewPage";
import ProjectDetailPage from "../pages/app/ProjectDetailPage";
import ProjectsPage from "../pages/app/ProjectsPage";
import SettingsPage from "../pages/app/SettingsPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/app",
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="overview" replace />,
          },
          {
            path: "overview",
            element: <OverviewPage />,
          },
          {
            path: "projects",
            element: <ProjectsPage />,
          },
          {
            path: "projects/:projectId",
            element: <ProjectDetailPage />,
          },
          {
            path: "decisions",
            element: <DecisionsPage />,
          },
          {
            path: "decisions/:decisionId",
            element: <DecisionDetailPage />,
          },
          {
            path: "graph",
            element: <GraphPage />,
          },
          {
            path: "activity",
            element: <ActivityPage />,
          },
          {
            path: "members",
            element: <MembersPage />,
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/app/overview" replace />,
  },
]);
