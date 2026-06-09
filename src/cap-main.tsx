import { QueryClient } from "@tanstack/react-query";
import { RouterProvider, createRouter, createHashHistory } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

// Enable native shell: safe areas, system font, tap-highlight off, no text select
document.documentElement.setAttribute("data-native-shell", "on");

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60_000, retry: 1 } },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// CRITICAL FIX: Hash history so Capacitor's local file server never tries
// to resolve /search etc. as actual filesystem paths — it always loads
// index.html first, then the JS router handles the #/search hash.
const hashHistory = createHashHistory();

const router = createRouter({
  routeTree,
  context: { queryClient },
  history: hashHistory,
  defaultPreload: "intent",
});

// Prompt for notification permission on first launch
if ("Notification" in window) {
  Notification.requestPermission().catch(() => {});
}

const el = document.getElementById("root");
if (el) {
  ReactDOM.createRoot(el).render(<RouterProvider router={router} />);
}