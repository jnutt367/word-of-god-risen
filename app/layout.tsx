import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Quicksand } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AskTeddy from "@/components/AskTeddy";
import GrandmaReset from "@/components/GrandmaReset";
import RegisterSW from "@/components/RegisterSW";
import { ProgressProvider } from "@/components/ProgressProvider";
import { PlanProvider } from "@/components/PlanProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://word-of-god-risen.vercel.app"),
  verification: {
    google: "AN98PURzX6yTs2oHSNkBULbkybRDCPd6kbkLseVLpME",
  },
  title: {
    default: "Word of God Risen — Centered on the King",
    template: "%s · Word of God Risen",
  },
  description:
    "The whole Bible, read out loud by Grandpa Teddy — every chapter free. No account, no password: tap a book, tap a chapter, tap Listen.",
  keywords: [
    "read book of enoch online",
    "book of jasher online",
    "book of jubilees online",
    "apocrypha online free",
    "lost books of the bible",
    "pseudepigrapha",
    "bible with cross references",
    "treasury of scripture knowledge",
    "kjv bible online",
    "web bible online",
    "bible reading plans",
    "truvine",
  ],
  authors: [{ name: "Jason Nutt", url: "https://www.youtube.com/@TruVINE365" }],
  creator: "Jason Nutt",
  appleWebApp: {
    capable: true,
    title: "Word of God Risen",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "Word of God Risen",
    title: "Word of God Risen — Centered on the King",
    description:
      "The whole Bible, read out loud by Grandpa Teddy — every chapter free. No account, no password: tap a book, tap a chapter, tap Listen.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Word of God Risen — Centered on the King",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Word of God Risen — Centered on the King",
    description:
      "The whole Bible, read out loud by Grandpa Teddy — every chapter free. No account, no password: tap a book, tap a chapter, tap Listen.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c1f16",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Word of God Risen",
    url: "https://word-of-god-risen.vercel.app",
    description:
      "The whole Bible, read out loud by Grandpa Teddy — every chapter free. No account, no password: tap a book, tap a chapter, tap Listen.",
    inLanguage: "en",
  };
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${quicksand.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-vineyard-950 text-cream-100 font-body">
        <GrandmaReset />
        <ProgressProvider>
          <PlanProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <AskTeddy />
          </PlanProvider>
        </ProgressProvider>
        <Analytics />
        <SpeedInsights />
        <RegisterSW />
      </body>
    </html>
  );
}
