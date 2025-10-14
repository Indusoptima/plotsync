"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Palette, Sofa, Hammer } from "lucide-react"
import { Label } from "@/components/ui/label"

interface Room {
  name: string
  x: number
  y: number
  width: number
  height: number
  material?: string
  color?: string
}

interface AdvancedEditPanelProps {
  onAddRoom: (room: {
    name: string
    x: number
    y: number
    width: number
    height: number
    material?: string
    color?: string
  }) => void
  onAddWall: (wall: { x1: number; y1: number; x2: number; y2: number; material?: string; color?: string }) => void
  onAddDoor: (door: { x: number; y: number; rotation: number }) => void
  onAddWindow: (window: { x: number; y: number; width: number }) => void
  onAddFurniture: (furniture: { roomIndex: number; type: string }) => void
  onClear: () => void
}

export function AdvancedEditPanel({
  onAddRoom,
  onAddWall,
  onAddDoor,
  onAddWindow,
  onAddFurniture,
  onClear,
}: AdvancedEditPanelProps) {
  const [activeTab, setActiveTab] = useState<"layout" | "materials" | "paint" | "furniture">("layout")
  const [activeLayoutTab, setActiveLayoutTab] = useState<"room" | "wall" | "door" | "window">("room")
  
  // Room form state
  const [roomName, setRoomName] = useState("")
  const [roomX, setRoomX] = useState(10)
  const [roomY, setRoomY] = useState(10)
  const [roomWidth, setRoomWidth] = useState(50)
  const [roomHeight, setRoomHeight] = useState(40)
  const [roomMaterial, setRoomMaterial] = useState("default")
  const [roomColor, setRoomColor] = useState("#E8E8E8")

  // Wall form state
  const [wallX1, setWallX1] = useState(0)
  const [wallY1, setWallY1] = useState(0)
  const [wallX2, setWallX2] = useState(100)
  const [wallY2, setWallY2] = useState(0)
  const [wallMaterial, setWallMaterial] = useState("default")
  const [wallColor, setWallColor] = useState("#FAFAFA")

  // Door form state
  const [doorX, setDoorX] = useState(50)
  const [doorY, setDoorY] = useState(0)
  const [doorRotation, setDoorRotation] = useState(0)

  // Window form state
  const [windowX, setWindowX] = useState(20)
  const [windowY, setWindowY] = useState(0)
  const [windowWidth, setWindowWidth] = useState(15)

  // Furniture state
  const [furnitureRoom, setFurnitureRoom] = useState(0)
  const [furnitureType, setFurnitureType] = useState("sofa")

  // Paint state
  const [paintColor, setPaintColor] = useState("#FFFFFF")
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0)

  const materials = [
    { value: "default", label: "Default", color: "#E8E8E8" },
    { value: "wood", label: "Wood", color: "#8B4513" },
    { value: "concrete", label: "Concrete", color: "#808080" },
    { value: "brick", label: "Brick", color: "#B22222" },
    { value: "marble", label: "Marble", color: "#F0F0F0" },
    { value: "tile", label: "Tile", color: "#D3D3D3" },
  ]

  const furnitureTypes = [
    { value: "sofa", label: "Sofa", icon: "🛋️" },
    { value: "bed", label: "Bed", icon: "🛏️" },
    { value: "table", label: "Table", icon: "🪑" },
    { value: "chair", label: "Chair", icon: "💺" },
    { value: "desk", label: "Desk", icon: "🖥️" },
    { value: "tv", label: "TV", icon: "📺" },
    { value: "fridge", label: "Fridge", icon: "🧊" },
    { value: "stove", label: "Stove", icon: "🔥" },
    { value: "wardrobe", label: "Wardrobe", icon: "👔" },
  ]

  const paintColors = [
    { name: "White", value: "#FFFFFF" },
    { name: "Beige", value: "#F5F5DC" },
    { name: "Light Gray", value: "#D3D3D3" },
    { name: "Cream", value: "#FFFDD0" },
    { name: "Light Blue", value: "#ADD8E6" },
    { name: "Mint", value: "#98FF98" },
    { name: "Lavender", value: "#E6E6FA" },
    { name: "Peach", value: "#FFDAB9" },
  ]

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
      material: roomMaterial,
      color: roomColor,
    })
    setRoomName("")
  }

  const handleAddWall = () => {
    onAddWall({
      x1: wallX1,
      y1: wallY1,
      x2: wallX2,
      y2: wallY2,
      material: wallMaterial,
      color: wallColor,
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

  const handleAddFurniture = () => {
    onAddFurniture({
      roomIndex: furnitureRoom,
      type: furnitureType,
    })
  }

  return (
    <div className="flex h-full flex-col bg-zinc-900 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Advanced Edit Mode</h2>
        <p className="text-sm text-zinc-400">Edit layouts, materials, paint, and furniture</p>
      </div>

      {/* Main Tab Selector */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <Button
          variant={activeTab === "layout" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("layout")}
        >
          <Hammer className="mr-1 h-3 w-3" />
          Layout
        </Button>
        <Button
          variant={activeTab === "materials" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("materials")}
        >
          <Hammer className="mr-1 h-3 w-3" />
          Materials
        </Button>
        <Button
          variant={activeTab === "paint" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("paint")}
        >
          <Palette className="mr-1 h-3 w-3" />
          Paint
        </Button>
        <Button
          variant={activeTab === "furniture" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("furniture")}
        >
          <Sofa className="mr-1 h-3 w-3" />
          Furniture
        </Button>
      </div>

      <Separator className="mb-4" />

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "layout" && (
          <>
            <div className="mb-4 grid grid-cols-4 gap-2">
              <Button
                variant={activeLayoutTab === "room" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveLayoutTab("room")}
              >
                Room
              </Button>
              <Button
                variant={activeLayoutTab === "wall" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveLayoutTab("wall")}
              >
                Wall
              </Button>
              <Button
                variant={activeLayoutTab === "door" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveLayoutTab("door")}
              >
                Door
              </Button>
              <Button
                variant={activeLayoutTab === "window" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveLayoutTab("window")}
              >
                Window
              </Button>
            </div>

            {activeLayoutTab === "room" && (
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-sm font-medium text-zinc-300">
                    Room Name
                  </Label>
                  <Input
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g., Living Room"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-zinc-300">
                      X Position
                    </Label>
                    <Input
                      type="number"
                      value={roomX}
                      onChange={(e) => setRoomX(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-zinc-300">
                      Y Position
                    </Label>
                    <Input
                      type="number"
                      value={roomY}
                      onChange={(e) => setRoomY(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-zinc-300">
                      Width
                    </Label>
                    <Input
                      type="number"
                      value={roomWidth}
                      onChange={(e) => setRoomWidth(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-zinc-300">
                      Height
                    </Label>
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

            {activeLayoutTab === "wall" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-zinc-300">
                      Start X
                    </Label>
                    <Input
                      type="number"
                      value={wallX1}
                      onChange={(e) => setWallX1(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-zinc-300">
                      Start Y
                    </Label>
                    <Input
                      type="number"
                      value={wallY1}
                      onChange={(e) => setWallY1(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-zinc-300">
                      End X
                    </Label>
                    <Input
                      type="number"
                      value={wallX2}
                      onChange={(e) => setWallX2(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-zinc-300">
                      End Y
                    </Label>
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

            {activeLayoutTab === "door" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-zinc-300">
                      X Position
                    </Label>
                    <Input
                      type="number"
                      value={doorX}
                      onChange={(e) => setDoorX(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-zinc-300">
                      Y Position
                    </Label>
                    <Input
                      type="number"
                      value={doorY}
                      onChange={(e) => setDoorY(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-medium text-zinc-300">
                    Rotation (degrees)
                  </Label>
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

            {activeLayoutTab === "window" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-zinc-300">
                      X Position
                    </Label>
                    <Input
                      type="number"
                      value={windowX}
                      onChange={(e) => setWindowX(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-zinc-300">
                      Y Position
                    </Label>
                    <Input
                      type="number"
                      value={windowY}
                      onChange={(e) => setWindowY(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-medium text-zinc-300">
                    Width
                  </Label>
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
          </>
        )}

        {activeTab === "materials" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Select a material to apply to rooms and walls
            </p>
            <div className="grid grid-cols-2 gap-3">
              {materials.map((material) => (
                <button
                  key={material.value}
                  onClick={() => {
                    setRoomMaterial(material.value)
                    setRoomColor(material.color)
                  }}
                  className={`rounded-lg border-2 p-4 transition-all ${
                    roomMaterial === material.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <div
                    className="mb-2 h-16 w-full rounded"
                    style={{ backgroundColor: material.color }}
                  />
                  <p className="text-sm font-medium text-white">{material.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "paint" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Choose a paint color for your rooms
            </p>
            <div className="grid grid-cols-2 gap-3">
              {paintColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    setPaintColor(color.value)
                    setRoomColor(color.value)
                  }}
                  className={`rounded-lg border-2 p-4 transition-all ${
                    paintColor === color.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <div
                    className="mb-2 h-16 w-full rounded border border-zinc-600"
                    style={{ backgroundColor: color.value }}
                  />
                  <p className="text-sm font-medium text-white">{color.name}</p>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <Label className="mb-2 block text-sm font-medium text-zinc-300">
                Custom Color
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={paintColor}
                  onChange={(e) => {
                    setPaintColor(e.target.value)
                    setRoomColor(e.target.value)
                  }}
                  className="h-12 w-full"
                />
                <Input
                  type="text"
                  value={paintColor}
                  onChange={(e) => {
                    setPaintColor(e.target.value)
                    setRoomColor(e.target.value)
                  }}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "furniture" && (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block text-sm font-medium text-zinc-300">
                Room Index
              </Label>
              <Input
                type="number"
                value={furnitureRoom}
                onChange={(e) => setFurnitureRoom(Number(e.target.value))}
                min={0}
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium text-zinc-300">
                Furniture Type
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {furnitureTypes.map((furniture) => (
                  <button
                    key={furniture.value}
                    onClick={() => setFurnitureType(furniture.value)}
                    className={`rounded-lg border-2 p-3 transition-all ${
                      furnitureType === furniture.value
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <div className="text-2xl">{furniture.icon}</div>
                    <p className="mt-1 text-xs text-white">{furniture.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleAddFurniture} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Furniture
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
          💡 Tip: Use the 3D View to see your changes in real-time
        </p>
      </div>
    </div>
  )
}
