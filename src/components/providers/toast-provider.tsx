"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "rgba(15, 10, 30, 0.95)",
          color: "#e2e8f0",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          backdropFilter: "blur(12px)",
          borderRadius: "12px",
          fontSize: "14px",
          fontFamily: "'Inter', sans-serif",
        },
        success: {
          iconTheme: {
            primary: "#8b5cf6",
            secondary: "#0f0a1e",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#0f0a1e",
          },
        },
      }}
    />
  );
}
