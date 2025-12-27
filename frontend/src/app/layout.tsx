import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Laxizen - Build Your Business Website Using Voice or Text",
  description: "AI-powered website builder for local businesses. Create professional websites in minutes using voice or text in Hindi & English. No coding required.",
  keywords: ["website builder", "AI", "local business", "Hindi", "voice to website", "small business website"],
  authors: [{ name: "Laxizen" }],
  openGraph: {
    title: "Laxizen - Build Your Business Website Using Voice or Text",
    description: "AI-powered website builder for local businesses. No coding required.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Laxizen - AI Website Builder for Local Businesses",
    description: "Create professional websites in minutes using voice or text.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

