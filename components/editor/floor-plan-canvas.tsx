"use client"

import { useRef, useEffect } from "react"
import { Stage, Layer, Line, Rect, Text, Circle, Group } from "react-konva"

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

interface FloorPlanCanvasProps {
  planData: FloorPlanData | null
  width: number
  height: number
}

export function FloorPlanCanvas({ planData, width, height }: FloorPlanCanvasProps) {
  const stageRef = useRef(null)

  if (!planData) {
    return (
      <div
        className="flex items-center justify-center bg-white"
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="mb-4 text-6xl">📐</div>
          <p className="text-lg text-gray-600">Generate a floor plan to get started</p>
        </div>
      </div>
    )
  }

  // Calculate bounds for centering - FIXED SCALE approach
  // Find actual min/max coordinates from all elements
  const allX = [
    ...planData.walls.flatMap(w => [w.x1, w.x2]),
    ...planData.rooms.map(r => r.x),
    ...planData.rooms.map(r => r.x + r.width),
  ]
  const allY = [
    ...planData.walls.flatMap(w => [w.y1, w.y2]),
    ...planData.rooms.map(r => r.y),
    ...planData.rooms.map(r => r.y + r.height),
  ]

  // Use actual bounds (no default 0 or 100)
  const minX = Math.min(...allX)
  const maxX = Math.max(...allX)
  const minY = Math.min(...allY)
  const maxY = Math.max(...allY)

  const planWidth = maxX - minX
  const planHeight = maxY - minY

  // FIXED SCALE: Use large consistent scale for all floor plans (15 pixels per meter)
  // This ensures all floor plans display prominently with consistent visual size
  const scale = 15  // 15 pixels = 1 meter (increased from 5 for much larger display)
  
  // Calculate scaled dimensions
  const scaledWidth = planWidth * scale
  const scaledHeight = planHeight * scale
  
  // Center the floor plan in the canvas - properly accounting for min coordinates
  const offsetX = (width - scaledWidth) / 2 - minX * scale
  const offsetY = (height - scaledHeight) / 2 - minY * scale

  // Helper function to calculate wall length
  const getWallLength = (wall: { x1: number; y1: number; x2: number; y2: number }) => {
    const dx = wall.x2 - wall.x1
    const dy = wall.y2 - wall.y1
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Helper function to get room area
  const getRoomArea = (room: { width: number; height: number }) => {
    return (room.width * room.height).toFixed(1)
  }

  return (
    <Stage width={width} height={height} ref={stageRef}>
      <Layer>
        {/* Dotted grid background */}
        {Array.from({ length: Math.ceil(width / 20) }).map((_, i) =>
          Array.from({ length: Math.ceil(height / 20) }).map((_, j) => (
            <Circle
              key={`${i}-${j}`}
              x={i * 20}
              y={j * 20}
              radius={1}
              fill="#e5e7eb"
            />
          ))
        )}
      </Layer>

      <Layer>
        {/* Walls with enhanced thickness */}
        {planData.walls.map((wall, index) => {
          const length = getWallLength(wall)
          const midX = (wall.x1 + wall.x2) / 2 * scale + offsetX
          const midY = (wall.y1 + wall.y2) / 2 * scale + offsetY
          const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1) * 180 / Math.PI
          
          return (
            <Group key={`wall-${index}`}>
              {/* Main wall */}
              <Line
                points={[
                  wall.x1 * scale + offsetX,
                  wall.y1 * scale + offsetY,
                  wall.x2 * scale + offsetX,
                  wall.y2 * scale + offsetY,
                ]}
                stroke="#1a1a1a"
                strokeWidth={8}
                lineCap="square"
              />
              {/* Wall dimension label */}
              {length > 5 && ( // Only show dimensions for walls longer than 5 units
                <Text
                  x={midX}
                  y={midY - 15}
                  text={`${length.toFixed(1)}m`}
                  fontSize={11}
                  fontFamily="Arial"
                  fontStyle="bold"
                  fill="#666666"
                  align="center"
                  rotation={angle > 90 || angle < -90 ? angle + 180 : angle}
                  offsetX={20}
                />
              )}
            </Group>
          )
        })}

        {/* Rooms with area labels */}
        {planData.rooms.map((room, index) => {
          const area = getRoomArea(room)
          const centerX = room.x * scale + offsetX + (room.width * scale) / 2
          const centerY = room.y * scale + offsetY + (room.height * scale) / 2
          
          return (
            <Group key={`room-${index}`}>
              <Rect
                x={room.x * scale + offsetX}
                y={room.y * scale + offsetY}
                width={room.width * scale}
                height={room.height * scale}
                fill="#ffffff"
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              {/* Room name */}
              <Text
                x={centerX}
                y={centerY - 20}
                text={room.name}
                fontSize={16}
                fontFamily="Arial"
                fontStyle="bold"
                fill="#1a1a1a"
                align="center"
                offsetX={room.width * scale / 2}
              />
              {/* Room area */}
              <Text
                x={centerX}
                y={centerY + 5}
                text={`${area} m²`}
                fontSize={12}
                fontFamily="Arial"
                fill="#666666"
                align="center"
                offsetX={room.width * scale / 2}
              />
              {/* Room dimensions (width x height) */}
              <Text
                x={centerX}
                y={centerY + 22}
                text={`${room.width.toFixed(1)} x ${room.height.toFixed(1)} m`}
                fontSize={10}
                fontFamily="Arial"
                fill="#999999"
                align="center"
                offsetX={room.width * scale / 2}
              />
              {/* Furniture symbols */}
              {room.furniture.map((item, fIndex) => (
                <Text
                  key={`furniture-${index}-${fIndex}`}
                  x={room.x * scale + offsetX + 15}
                  y={room.y * scale + offsetY + 15 + fIndex * 25}
                  text={getFurnitureSymbol(item)}
                  fontSize={18}
                  fill="#6b7280"
                />
              ))}
            </Group>
          )
        })}

        {/* Doors - enhanced */}
        {planData.doors.map((door, index) => {
          const doorX = door.x * scale + offsetX
          const doorY = door.y * scale + offsetY
          const doorWidth = 30 * (scale / 2)
          const angle = door.rotation
          
          return (
            <Group key={`door-${index}`} x={doorX} y={doorY} rotation={angle}>
              {/* Door arc */}
              <Line
                points={[
                  0, 0,
                  doorWidth, 0,
                ]}
                stroke="#8b5cf6"
                strokeWidth={6}
                lineCap="round"
              />
              <Line
                points={[
                  0, 0,
                  doorWidth * 0.7, -doorWidth * 0.7,
                ]}
                stroke="#8b5cf6"
                strokeWidth={2}
                dash={[5, 5]}
              />
            </Group>
          )
        })}

        {/* Windows - enhanced */}
        {planData.windows.map((window, index) => (
          <Group key={`window-${index}`}>
            <Rect
              x={window.x * scale + offsetX}
              y={window.y * scale + offsetY - 3}
              width={window.width * scale}
              height={6}
              fill="#3b82f6"
              stroke="#2563eb"
              strokeWidth={1}
            />
            {/* Window frame lines */}
            <Line
              points={[
                window.x * scale + offsetX,
                window.y * scale + offsetY - 3,
                window.x * scale + offsetX,
                window.y * scale + offsetY + 3,
              ]}
              stroke="#1d4ed8"
              strokeWidth={2}
            />
            <Line
              points={[
                window.x * scale + offsetX + window.width * scale,
                window.y * scale + offsetY - 3,
                window.x * scale + offsetX + window.width * scale,
                window.y * scale + offsetY + 3,
              ]}
              stroke="#1d4ed8"
              strokeWidth={2}
            />
          </Group>
        ))}
      </Layer>
    </Stage>
  )
}

function getFurnitureSymbol(item: string): string {
  const symbols: Record<string, string> = {
    bed: "🛏️",
    sofa: "🛋️",
    tv: "📺",
    toilet: "🚽",
    sink: "🚿",
    shower: "🚿",
    bathtub: "🛁",
    stove: "🍳",
    refrigerator: "❄️",
    "dining table": "🍽️",
    wardrobe: "👔",
    desk: "🖥️",
    chair: "🪑",
  }
  return symbols[item.toLowerCase()] || "📦"
}
