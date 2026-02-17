import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Live Polls — Real-time Polling by Adarsh Tiwari",
  description:
    "Create and share real-time polls instantly. Built by Adarsh Tiwari.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans`}>
        <div className="min-h-screen flex flex-col">
          {/* ── Header ── */}
          <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
              <a href="/" className="flex items-center gap-2 text-lg font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                </svg>
                Live Polls
              </a>
            </div>
          </header>

          {/* ── Main ── */}
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
            {children}
          </main>

          {/* ── Footer ── */}
          <footer className="border-t border-gray-200 bg-white">
            <div className="mx-auto max-w-3xl px-4 py-8">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:items-start">
                {/* About */}
                <div className="text-center sm:text-left">
                  <p className="text-sm font-semibold text-gray-900">Adarsh Tiwari</p>
                  <p className="mt-0.5 text-xs text-gray-500">Full-Stack Developer</p>
                </div>

                {/* Contact */}
                <div className="flex flex-col items-center gap-1 sm:items-end text-xs text-gray-500">
                  <a href="mailto:adarshtiwaridev@gmail.com" className="hover:text-indigo-600 transition-colors">
                    adarshtiwaridev@gmail.com
                  </a>
                  <a href="https://github.com/adarsh1278" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
                    github.com/adarsh1278
                  </a>
                  <a href="https://linkedin.com/in/adarsh-tiwari-dev" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
                    LinkedIn
                  </a>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
                © {new Date().getFullYear()} Adarsh Tiwari. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
