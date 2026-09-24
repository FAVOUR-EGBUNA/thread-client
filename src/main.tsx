import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { applyTheme, getStoredTheme } from "./lib/theme";
import { router } from "./routes/router";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";

applyTheme(getStoredTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <RouterProvider router={router} />
      </WorkspaceProvider>
    </QueryClientProvider>
  </StrictMode>,
);