import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { Navbar } from "@/components/layout/navbar";
import { AppBackground } from "@/components/layout/app-background";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: {
    default: "AI GitHub README Generator",
    template: "%s | AI GitHub README Generator",
  },
  description:
    "Generate professional README.md files from your GitHub repositories with AI, then commit instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} bg-slate-950 font-sans text-slate-100 antialiased`}
      >
        <AuthSessionProvider>
          <AppBackground>
            <Navbar />
            <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
              {children}
            </main>
          </AppBackground>
          <ToastProvider />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
