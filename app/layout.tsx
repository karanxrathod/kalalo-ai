import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalalo — AI Captioning & Subtitle Studio for Creators",
  description: "Auto-generate, edit, style, and burn beautiful captions in Hinglish, Hindi, and English for Reels, Shorts, and TikTok.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Nirmala+UI:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#090B0E] text-slate-100 antialiased selection:bg-purple-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
