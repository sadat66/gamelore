import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/providers/toast-provider";

export const metadata: Metadata = {
  title: "GameLore AI — Unravel the Legends",
  description:
    "Your AI-powered companion for exploring game lore, mythology, and hidden storylines. Powered by RAG and LLMs.",
  keywords: ["game lore", "AI chatbot", "RPG lore", "game mythology", "RAG"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
