"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FloorPlanData {
  walls: Array<{ x1: number; y1: number; x2: number; y2: number }>
  rooms: Array<{
    name: string
    x: number
    y: number
    width: number
    height: number
    furniture: string[]
  }>
  doors: Array<{ x: number; y: number; rotation: number }>
  windows: Array<{ x: number; y: number; width: number }>
}

interface VariationGalleryProps {
  variations: FloorPlanData[]
  currentIndex: number
  onSelect: (index: number) => void
  onLoadMore?: () => void
}

export function VariationGallery({
  variations,
  currentIndex,
  onSelect,
  onLoadMore,
}: VariationGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" })
    }
  }

  return (
    <div className="flex items-center gap-3 border-t border-zinc-800 bg-zinc-900 px-4 py-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={scrollLeft}
        className="h-8 w-8 shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollContainerRef}
        className="flex flex-1 gap-3 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {variations.map((variation, index) => (
          <VariationThumbnail
            key={index}
            variation={variation}
            index={index}
            isSelected={currentIndex === index}
            onClick={() => onSelect(index)}
          />
        ))}

        {onLoadMore && (
          <button
            onClick={onLoadMore}
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800 transition-all hover:border-zinc-600 hover:bg-zinc-750"
          >
            <div className="text-center">
              <MoreHorizontal className="mx-auto h-5 w-5 text-zinc-400" />
              <span className="mt-1 text-xs text-zinc-400">More</span>
            </div>
          </button>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={scrollRight}
        className="h-8 w-8 shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function VariationThumbnail({
  variation,
  index,
  isSelected,
  onClick,
}: {
  variation: FloorPlanData
  index: number
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/50"
          : "border-zinc-700 bg-white hover:border-zinc-600 hover:ring-2 hover:ring-zinc-600/50"
      }`}
    >
      {/* Mini floor plan preview */}
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Draw simplified walls */}
        {variation.walls.map((wall, i) => (
          <line
            key={`wall-${i}`}
            x1={wall.x1 / 2}
            y1={wall.y1 / 2}
            x2={wall.x2 / 2}
            y2={wall.y2 / 2}
            stroke="#1f2937"
            strokeWidth="1.5"
          />
        ))}

        {/* Draw simplified rooms */}
        {variation.rooms.map((room, i) => (
          <rect
            key={`room-${i}`}
            x={room.x / 2}
            y={room.y / 2}
            width={room.width / 2}
            height={room.height / 2}
            fill="#f3f4f6"
            stroke="#d1d5db"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[1px]"></div>
      )}

      {/* Variation number badge */}
      <div
        className={`absolute bottom-1 right-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
          isSelected
            ? "bg-blue-500 text-white"
            : "bg-zinc-800 text-zinc-300"
        }`}
      >
        {index + 1}
      </div>
    </button>
  )
}
