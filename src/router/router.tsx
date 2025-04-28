
import { createBrowserRouter } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Index from "@/pages/Index";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import Clients from "@/pages/Clients";
import Team from "@/pages/Team";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: "/",
            element: <Index />
          },
          {
            path: "/projects",
            element: <Projects />
          },
          {
            path: "/projects/:id",
            element: <ProjectDetails />
          },
          {
            path: "/clients",
            element: <Clients />
          },
          {
            path: "/team",
            element: <Team />
          }
        ]
      }
    ]
  },
  {
    path: "*",
    element: <NotFound />
  }
]);
