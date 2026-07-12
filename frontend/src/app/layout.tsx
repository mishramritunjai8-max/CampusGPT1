import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusGPT | Premium AI College Assistant",
  description: "CampusGPT is an AI-powered college assistant designed to help students, faculty, and administrators navigate course materials, schedules, grades, and campus operations.",
  keywords: ["AI college assistant", "university assistant", "ChatGPT college", "syllabus AI generator", "grade calculator AI"],
  authors: [{ name: "CampusGPT Team" }],
  openGraph: {
    title: "CampusGPT | AI College Assistant",
    description: "Navigate university life with your personal AI co-pilot.",
    url: "https://campusgpt.edu",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
