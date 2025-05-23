
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "@/pages/Index";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import Clients from "@/pages/Clients";
import Team from "@/pages/Team";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import Billing from "@/pages/Billing";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/",
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      </AuthProvider>
    ),
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "projects",
        element: <Projects />,
      },
      {
        path: "projects/:id",
        element: <ProjectDetails />,
      },
      {
        path: "clients",
        element: <Clients />,
      },
      {
        path: "team",
        element: <Team />,
      },
      {
        path: "billing",
        element: <Billing />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
