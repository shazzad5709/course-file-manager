import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Course File Manager",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--text-default)]">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <header className="border-b border-[var(--border)] bg-[var(--elevated)]">
              <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
                <span className="text-base font-semibold text-[var(--text-default)]">
                  Course File Manager
                </span>
                <ThemeToggle />
              </nav>
            </header>
            <main className="flex-1 bg-[var(--background)]">
              <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
