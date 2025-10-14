"use client"

import { Zap, Layout, Shuffle, Download } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "AI-Powered Generation",
    description: "Advanced AI creates professional floor plans in seconds based on your exact specifications"
  },
  {
    icon: Layout,
    title: "Multiple Variations",
    description: "Generate 5 unique layout proposals per request, each with multiple variations to choose from"
  },
  {
    icon: Shuffle,
    title: "Smart Rearrangement",
    description: "Don't like a layout? Rearrange rooms with a single click while maintaining your parameters"
  },
  {
    icon: Download,
    title: "Professional Export",
    description: "Export your floor plans to DXF format, ready for CAD software and professional use"
  }
]

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Everything You Need
          </h2>
          <p className="text-lg text-zinc-400">
            Professional floor plan generation made simple and accessible
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
