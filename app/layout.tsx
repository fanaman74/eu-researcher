import type { Metadata, Viewport } from "next";
import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "EU Researcher — EU affairs monitoring",
  description: "Monitor EU legislative files, Commission plans, consultations, Parliament activity and Italian politics in one place.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-dvh bg-canvas text-fg">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
