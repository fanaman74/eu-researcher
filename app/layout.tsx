import type { Metadata, Viewport } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const publicSans = Public_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-public-sans", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin", "latin-ext"], variable: "--font-source-serif", display: "swap" });

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
    <html lang="en" className={`${publicSans.variable} ${sourceSerif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased min-h-dvh bg-canvas text-fg">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
