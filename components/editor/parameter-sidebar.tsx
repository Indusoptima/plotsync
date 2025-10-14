"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Loader2 } from "lucide-react"

interface ParameterSidebarProps {
  onGenerate: (params: FloorPlanParams) => void
  loading: boolean
}

export interface FloorPlanParams {
  totalArea: number
  unit: "metric" | "imperial"
  floors: number
  rooms: {
    bedroom: number
    bathroom: number
    kitchen: number
    livingRoom: number
    diningRoom: number
  }
}

export function ParameterSidebar({ onGenerate, loading }: ParameterSidebarProps) {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric")
  const [totalArea, setTotalArea] = useState(150)
  const [floors, setFloors] = useState(1)
  const [rooms, setRooms] = useState({
    bedroom: 3,
    bathroom: 2,
    kitchen: 1,
    livingRoom: 1,
    diningRoom: 1,
  })

  const handleRoomChange = (room: keyof typeof rooms, delta: number) => {
    setRooms(prev => ({
      ...prev,
      [room]: Math.max(0, prev[room] + delta),
    }))
  }

  const handleGenerate = () => {
    onGenerate({
      totalArea,
      unit,
      floors,
      rooms,
    })
  }

  return (
    <div className="flex h-full flex-col bg-zinc-900 p-6">
      <h2 className="mb-6 text-xl font-bold text-white">Floor Plan Parameters</h2>

      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* Unit Selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Unit System
          </label>
          <ToggleGroup
            type="single"
            value={unit}
            onValueChange={(value) => value && setUnit(value as "metric" | "imperial")}
            className="w-full"
          >
            <ToggleGroupItem value="metric" className="flex-1">
              Metric (m²)
            </ToggleGroupItem>
            <ToggleGroupItem value="imperial" className="flex-1">
              Imperial (ft²)
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Total Area */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Total Area
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={totalArea}
              onChange={(e) => setTotalArea(Number(e.target.value))}
              min={50}
              max={1000}
            />
            <span className="text-sm text-zinc-400">
              {unit === "metric" ? "m²" : "ft²"}
            </span>
          </div>
        </div>

        {/* Number of Floors */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Number of Floors
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFloors(Math.max(1, floors - 1))}
              disabled={floors <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={floors}
              onChange={(e) => setFloors(Number(e.target.value))}
              min={1}
              max={3}
              className="text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFloors(Math.min(3, floors + 1))}
              disabled={floors >= 3}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Room Counts */}
        <div>
          <h3 className="mb-4 text-sm font-medium text-zinc-300">Room Quantities</h3>
          
          <div className="space-y-4">
            <RoomCounter
              label="Bedrooms"
              value={rooms.bedroom}
              onChange={(delta) => handleRoomChange("bedroom", delta)}
            />
            <RoomCounter
              label="Bathrooms"
              value={rooms.bathroom}
              onChange={(delta) => handleRoomChange("bathroom", delta)}
            />
            <RoomCounter
              label="Kitchen"
              value={rooms.kitchen}
              onChange={(delta) => handleRoomChange("kitchen", delta)}
              max={1}
            />
            <RoomCounter
              label="Living Room"
              value={rooms.livingRoom}
              onChange={(delta) => handleRoomChange("livingRoom", delta)}
              max={1}
            />
            <RoomCounter
              label="Dining Room"
              value={rooms.diningRoom}
              onChange={(delta) => handleRoomChange("diningRoom", delta)}
              max={1}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button
          className="w-full"
          size="lg"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Floor Plans"
          )}
        </Button>
      </div>
    </div>
  )
}

interface RoomCounterProps {
  label: string
  value: number
  onChange: (delta: number) => void
  max?: number
}

function RoomCounter({ label, value, onChange, max = 10 }: RoomCounterProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-300">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(-1)}
          disabled={value <= 0}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm text-white">{value}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(1)}
          disabled={value >= max}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
