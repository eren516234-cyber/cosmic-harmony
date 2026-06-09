import { QueryClient } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60_000, retry: 1 } },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
});

if ("Notification" in window) {
  Notification.requestPermission().catch(() => {});
}

const el = document.getElementById("root");
if (el) {
  ReactDOM.createRoot(el).render(<RouterProvider router={router} />);
}