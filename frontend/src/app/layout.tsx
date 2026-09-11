import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/authContext";
import { ThemeProvider } from "@/lib/themeContext";
import ApplicationChatbot from "@/components/chatbot/ApplicationChatbot";

export const metadata: Metadata = {
  title: "METI Assessment Platform | Enterprise Evaluation Engine",
  description: "High-performance full-stack online assessment and testing platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col antialiased">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
              METI Assessment Platform © 2026. Built with Next.js, FastAPI & PostgreSQL.
            </footer>
            <ApplicationChatbot />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

