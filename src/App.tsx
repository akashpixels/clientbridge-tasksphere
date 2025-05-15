
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router/router";
import { AuthProvider } from "@/context/auth";
import { LayoutProvider } from "@/context/layout";
import { ProjectLayoutProvider } from './context/project-layout';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LayoutProvider>
          <ProjectLayoutProvider>
            <RouterProvider router={router} />
            <Toaster />
          </ProjectLayoutProvider>
        </LayoutProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
