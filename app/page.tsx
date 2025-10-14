import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"
import { FAQ } from "@/components/landing/faq"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <Navbar />
      <Hero />
      <Features />
      <div id="pricing">
        <Pricing />
      </div>
      <div id="faq">
        <FAQ />
      </div>
      
      <footer className="border-t border-zinc-800 bg-zinc-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-purple-600"></div>
              <span className="font-semibold text-white">PlotSync</span>
            </div>
            <p className="text-sm text-zinc-400">
              © 2025 PlotSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
