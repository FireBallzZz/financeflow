import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceWorkerRegister } from "@/components/layout/sw-register";
import { DbSeed } from "@/components/layout/db-seed";
import { OnboardingDialog } from "@/components/layout/onboarding-dialog";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "FinanceFlow — Personal Finance Manager",
  description: "Offline-first, privacy-focused personal finance manager. Your data never leaves your browser.",
  applicationName: "FinanceFlow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinanceFlow",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d14" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Deliberately NOT setting maximumScale/userScalable=false: locking pinch-
  // zoom fails WCAG 1.4.4 (Resize Text) and actively hurts anyone with low
  // vision on a finance app where reading amounts correctly matters.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <DbSeed />
          <ServiceWorkerRegister />
          <AppShell>{children}</AppShell>
          <OnboardingDialog />
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
