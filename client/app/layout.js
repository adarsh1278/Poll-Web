import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Live Polls",
  description: "Create and share real-time polls",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans`}>
        <div className="min-h-screen">
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-2xl px-4 py-4">
              <a href="/" className="text-lg font-bold text-indigo-600">
                Live Polls
              </a>
            </div>
          </header>
          <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
