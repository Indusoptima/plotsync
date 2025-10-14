"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950"></div>
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-zinc-300">AI-Powered Floor Plan Generation</span>
          </div>
          
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl">
            Design Your Dream Home with{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          
          <p className="mb-8 text-lg text-zinc-400 md:text-xl">
            Generate professional residential floor plans in seconds. Just input your requirements 
            and let our AI create multiple layout variations tailored to your needs.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button size="lg" className="group">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                See How It Works
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 text-sm text-zinc-500">
            No credit card required • Generate up to 5 floor plans free
          </div>
        </div>
      </div>
    </section>
  )
}
