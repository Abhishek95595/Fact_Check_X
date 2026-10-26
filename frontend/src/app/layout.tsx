import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fake News Detection | NLP Research Dashboard",
  description: "Decision-support NLP platform for detecting sensational vs factual linguistic patterns in news articles.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container" style={{ paddingTop: "2rem" }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
