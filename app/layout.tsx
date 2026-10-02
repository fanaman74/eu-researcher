import type { Metadata, Viewport } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const firaSans = Fira_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--font-fira-sans", display: "swap" });
const firaCode = Fira_Code({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-fira-code", display: "swap" });

export const metadata: Metadata = {
  title: "EU Researcher — EU affairs monitoring",
  description: "Monitor EU legislative files, Commission plans, consultations, Parliament activity and Italian politics in one place.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Applies a saved theme before first paint so the page never flashes the wrong colours.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${firaSans.variable} ${firaCode.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased min-h-dvh bg-canvas text-fg">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
