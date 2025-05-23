
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router/router";
import { LayoutProvider } from "@/context/layout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LayoutProvider>
        <RouterProvider router={router} />
        <Toaster />
      </LayoutProvider>
    </QueryClientProvider>
  );
}

export default App;
