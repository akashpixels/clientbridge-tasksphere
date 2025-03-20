
import { createBrowserRouter } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Index from "@/pages/Index";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import Clients from "@/pages/Clients";
import Team from "@/pages/Team";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Create the router with all routes defined
export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Index />
      },
      {
        path: "projects",
        element: <Projects />
      },
      {
        path: "projects/:id",
        element: <ProjectDetails />
      },
      {
        path: "clients",
        element: <Clients />
      },
      {
        path: "team",
        element: <Team />
      }
    ]
  }
]);
