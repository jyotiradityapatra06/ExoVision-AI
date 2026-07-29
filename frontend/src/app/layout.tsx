import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExoVision AI - AI-Powered Exoplanet Transit Detection",
  description:
    "Detect exoplanet transit signals from astronomical light-curve time-series data using artificial intelligence and deep learning.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-astro-dark min-h-screen selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
