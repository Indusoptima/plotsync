"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free Forever",
    price: "$0",
    period: "forever",
    features: [
      "Unlimited floor plan generations",
      "Unlimited proposals",
      "Multiple variations per generation",
      "Advanced Edit mode",
      "DXF export",
      "Unlimited saved projects",
      "All features included"
    ],
    cta: "Get Started",
    href: "/signup",
    popular: true
  }
]

export function Pricing() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-zinc-400">
            Start for free, upgrade when you need more
          </p>
        </div>
        
        <div className="mx-auto grid max-w-2xl gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-lg border p-8 ${
                plan.popular
                  ? "border-blue-500 bg-zinc-900"
                  : "border-zinc-800 bg-zinc-900/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-bold text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-zinc-400">/{plan.period}</span>
                </div>
              </div>
              
              <ul className="mb-8 space-y-4">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-green-500" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
