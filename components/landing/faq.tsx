"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "How does the AI floor plan generator work?",
    answer: "Our AI analyzes your input parameters (total area, room counts, floors) and generates professional floor plans using advanced algorithms. It considers optimal room placement, traffic flow, and architectural best practices."
  },
  {
    question: "Can I edit the generated floor plans?",
    answer: "Yes! Click the 'Advanced Edit' button in the editor to manually add or modify rooms, walls, doors, and windows. You have full control over every element of your floor plan."
  },
  {
    question: "What file formats can I export to?",
    answer: "Floor plans can be exported to DXF format, which is compatible with AutoCAD, SketchUp, and most professional CAD software. PNG exports are also available."
  },
  {
    question: "How many floor plans can I generate?",
    answer: "Unlimited! You can generate as many floor plan proposals as you need. Each generation produces 5 variations, and all proposals are saved for comparison."
  },
  {
    question: "Can I use these plans for actual construction?",
    answer: "Our floor plans are great starting points and concept designs. For actual construction, we recommend having a licensed architect review and finalize the plans according to local building codes."
  },
  {
    question: "What's the difference between Metric and Imperial units?",
    answer: "You can toggle between Metric (square meters) and Imperial (square feet) units. All measurements and room sizes will be calculated and displayed in your chosen unit system."
  },
  {
    question: "Is PlotSync really free?",
    answer: "Yes! PlotSync is completely free with all features included - unlimited generations, advanced editing, DXF export, and unlimited saved projects. No hidden fees or premium tiers."
  }
]

export function FAQ() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-zinc-400">
              Everything you need to know about PlotSync
            </p>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-white">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
