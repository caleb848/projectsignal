import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/layout/theme";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ProjectSignal",
    template: "%s · ProjectSignal",
  },
  description:
    "A project health and creative operations dashboard exploring how teams can surface risks, dependencies, approval bottlenecks and launch readiness. All data is fictional.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="flex min-h-screen flex-col font-sans text-[14px]">
        <ThemeProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 pt-8 sm:px-6 lg:px-8">{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
