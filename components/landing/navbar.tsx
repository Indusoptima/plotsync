"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlotSyncLogo } from "@/components/ui/plotsync-logo"

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <PlotSyncLogo size={32} />
            <span className="text-xl font-bold text-white">PlotSync</span>
          </Link>
          
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-zinc-300 hover:text-white">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-zinc-300 hover:text-white">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm text-zinc-300 hover:text-white">
              FAQ
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
