import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import packageJson from "../package.json";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const appVersion = packageJson.version;

export const metadata: Metadata = {
  title: "Course Files",
  description: "Manage and organize academic course files for accreditation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--text-default)]">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <header className="border-b border-[var(--border)] bg-[var(--elevated)]">
              <nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
                <span
                  className="text-base font-semibold text-[var(--text-default)]"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Course Files
                </span>
                <ThemeToggle />
              </nav>
            </header>
            <main className="flex-1 bg-[var(--background)]">
              <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
                {children}
              </div>
            </main>
            <footer className="border-t border-[var(--border)] bg-[var(--elevated)]">
              <div className="mx-auto grid w-full max-w-7xl gap-3 px-4 py-5 text-xs leading-5 text-[var(--text-faded)] sm:px-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="text-center md:text-left">
                  <p className="font-medium text-[var(--text-default)]">
                    Academic accreditation file organizer
                  </p>
                </div>
                <p className="text-center">
                  Developed by{" "}
                  <span className="font-semibold text-[var(--text-default)]">
                    Shazzad Hossain{" "}
                  </span>
                  (Lecturer, Daffodil International University)
                </p>
                <p className="text-center font-medium text-[var(--text-default)] md:text-right">
                  Version {appVersion}
                </p>
              </div>
            </footer>
          </div>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
