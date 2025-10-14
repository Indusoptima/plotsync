"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, Move, Trash2 } from "lucide-react"

interface EditModePanelProps {
  onAddRoom: (room: {
    name: string
    x: number
    y: number
    width: number
    height: number
  }) => void
  onAddWall: (wall: { x1: number; y1: number; x2: number; y2: number }) => void
  onAddDoor: (door: { x: number; y: number; rotation: number }) => void
  onAddWindow: (window: { x: number; y: number; width: number }) => void
  onClear: () => void
}

export function EditModePanel({
  onAddRoom,
  onAddWall,
  onAddDoor,
  onAddWindow,
  onClear,
}: EditModePanelProps) {
  const [activeTab, setActiveTab] = useState<"room" | "wall" | "door" | "window">("room")
  
  // Room form state
  const [roomName, setRoomName] = useState("")
  const [roomX, setRoomX] = useState(10)
  const [roomY, setRoomY] = useState(10)
  const [roomWidth, setRoomWidth] = useState(50)
  const [roomHeight, setRoomHeight] = useState(40)

  // Wall form state
  const [wallX1, setWallX1] = useState(0)
  const [wallY1, setWallY1] = useState(0)
  const [wallX2, setWallX2] = useState(100)
  const [wallY2, setWallY2] = useState(0)

  // Door form state
  const [doorX, setDoorX] = useState(50)
  const [doorY, setDoorY] = useState(0)
  const [doorRotation, setDoorRotation] = useState(0)

  // Window form state
  const [windowX, setWindowX] = useState(20)
  const [windowY, setWindowY] = useState(0)
  const [windowWidth, setWindowWidth] = useState(15)

  const handleAddRoom = () => {
    if (!roomName.trim()) {
      alert("Please enter a room name")
      return
    }
    onAddRoom({
      name: roomName,
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
    })
    setRoomName("")
  }

  const handleAddWall = () => {
    onAddWall({
      x1: wallX1,
      y1: wallY1,
      x2: wallX2,
      y2: wallY2,
    })
  }

  const handleAddDoor = () => {
    onAddDoor({
      x: doorX,
      y: doorY,
      rotation: doorRotation,
    })
  }

  const handleAddWindow = () => {
    onAddWindow({
      x: windowX,
      y: windowY,
      width: windowWidth,
    })
  }

  return (
    <div className="flex h-full flex-col bg-zinc-900 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Advanced Edit Mode</h2>
        <p className="text-sm text-zinc-400">Manually add or modify elements</p>
      </div>

      {/* Tab Selector */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <Button
          variant={activeTab === "room" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("room")}
        >
          Room
        </Button>
        <Button
          variant={activeTab === "wall" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("wall")}
        >
          Wall
        </Button>
        <Button
          variant={activeTab === "door" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("door")}
        >
          Door
        </Button>
        <Button
          variant={activeTab === "window" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("window")}
        >
          Window
        </Button>
      </div>

      <Separator className="mb-4" />

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "room" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Room Name
              </label>
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., Living Room"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  X Position
                </label>
                <Input
                  type="number"
                  value={roomX}
                  onChange={(e) => setRoomX(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Y Position
                </label>
                <Input
                  type="number"
                  value={roomY}
                  onChange={(e) => setRoomY(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Width
                </label>
                <Input
                  type="number"
                  value={roomWidth}
                  onChange={(e) => setRoomWidth(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Height
                </label>
                <Input
                  type="number"
                  value={roomHeight}
                  onChange={(e) => setRoomHeight(Number(e.target.value))}
                />
              </div>
            </div>

            <Button onClick={handleAddRoom} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </div>
        )}

        {activeTab === "wall" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Start X
                </label>
                <Input
                  type="number"
                  value={wallX1}
                  onChange={(e) => setWallX1(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Start Y
                </label>
                <Input
                  type="number"
                  value={wallY1}
                  onChange={(e) => setWallY1(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  End X
                </label>
                <Input
                  type="number"
                  value={wallX2}
                  onChange={(e) => setWallX2(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  End Y
                </label>
                <Input
                  type="number"
                  value={wallY2}
                  onChange={(e) => setWallY2(Number(e.target.value))}
                />
              </div>
            </div>

            <Button onClick={handleAddWall} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Wall
            </Button>
          </div>
        )}

        {activeTab === "door" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  X Position
                </label>
                <Input
                  type="number"
                  value={doorX}
                  onChange={(e) => setDoorX(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Y Position
                </label>
                <Input
                  type="number"
                  value={doorY}
                  onChange={(e) => setDoorY(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Rotation (degrees)
              </label>
              <Input
                type="number"
                value={doorRotation}
                onChange={(e) => setDoorRotation(Number(e.target.value))}
                min={0}
                max={360}
              />
            </div>

            <Button onClick={handleAddDoor} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Door
            </Button>
          </div>
        )}

        {activeTab === "window" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  X Position
                </label>
                <Input
                  type="number"
                  value={windowX}
                  onChange={(e) => setWindowX(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Y Position
                </label>
                <Input
                  type="number"
                  value={windowY}
                  onChange={(e) => setWindowY(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Width
              </label>
              <Input
                type="number"
                value={windowWidth}
                onChange={(e) => setWindowWidth(Number(e.target.value))}
              />
            </div>

            <Button onClick={handleAddWindow} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Window
            </Button>
          </div>
        )}
      </div>

      <Separator className="my-4" />

      {/* Clear All Button */}
      <Button variant="destructive" onClick={onClear} className="w-full">
        <Trash2 className="mr-2 h-4 w-4" />
        Clear All
      </Button>

      <div className="mt-4 rounded-lg bg-zinc-800 p-3">
        <p className="text-xs text-zinc-400">
          💡 Tip: Click "Exit Edit Mode" to return to normal view
        </p>
      </div>
    </div>
  )
}
