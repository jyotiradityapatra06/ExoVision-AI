import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { SiteLayout } from "@/components/layout";
import { AuthProvider } from "@/contexts/AuthContext";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
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
      className={`dark ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen bg-obs-void text-starlight antialiased selection:bg-sky-500/30 selection:text-white">
        <AuthProvider><SiteLayout>{children}</SiteLayout></AuthProvider>
      </body>
    </html>
  );
}
