import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Quicksand } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
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
    "Read the Book of Enoch, Jasher, Jubilees and the Apocrypha online free — plus the full Bible in WEB & KJV with verse-by-verse cross-references, reading plans and progress tracking. Centered on the King, not the crowds.",
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
  openGraph: {
    type: "website",
    siteName: "Word of God Risen",
    title: "Word of God Risen — Centered on the King",
    description:
      "Enoch, Jasher, Jubilees, the Apocrypha — plus the full Bible in WEB & KJV with verse cross-references and reading plans. Centered on the King, not the crowds.",
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
      "Enoch, Jasher, Jubilees, the Apocrypha — plus the full Bible in WEB & KJV with verse cross-references and reading plans.",
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
      "Read the lost books of the Bible — Enoch, Jasher, Jubilees, the Apocrypha — plus the full Bible in WEB & KJV with verse cross-references, reading plans and progress tracking.",
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
        <ProgressProvider>
          <PlanProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </PlanProvider>
        </ProgressProvider>
        <Analytics />
      </body>
    </html>
  );
}
