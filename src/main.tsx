import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import "./index.css";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { queryClient } from "./lib/queryClient";
import { router } from "./routes/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <RouterProvider router={router} />
      </WorkspaceProvider>
    </QueryClientProvider>
  </StrictMode>,
);
