import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";

import { SiteLayout } from "@/components/layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomObservatoryCursor } from "@/components/ui/CustomObservatoryCursor";

import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "ExoVision AI — AI-Assisted Exoplanet Candidate Screening",
    template: "%s | ExoVision AI",
  },
  description:
    "Analyze stellar observations, detect transit-like signals, and screen exoplanet candidates with machine learning.",
  keywords: [
    "Exoplanets",
    "Astronomy",
    "Transit Photometry",
    "Kepler",
    "TESS",
    "Artificial Intelligence",
    "Machine Learning",
    "FastAPI",
  ],
  openGraph: {
    title: "ExoVision AI",
    description: "AI-assisted exoplanet candidate screening from stellar light curves.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "ExoVision AI exoplanet transit platform" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ExoVision AI",
    description: "AI-assisted exoplanet candidate screening from stellar light curves.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-[#07090D] text-stone-900 antialiased selection:bg-blue-600/20 selection:text-blue-900"
        suppressHydrationWarning
      >
        <CustomObservatoryCursor />
        <AuthProvider><SiteLayout>{children}</SiteLayout></AuthProvider>
      </body>
    </html>
  );
}
