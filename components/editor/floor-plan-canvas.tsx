"use client"

import { useRef, useEffect, useState } from "react"
import { Stage, Layer, Line, Rect, Text, Circle, Group } from "react-konva"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import Konva from "konva"
import { STROKE_CONFIG, ADAPTIVE_SCALE } from "@/lib/floor-plan/config"

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
  const stageRef = useRef<Konva.Stage>(null)
  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })

  // Auto-fit to screen when plan data changes
  useEffect(() => {
    if (planData && stageRef.current) {
      handleFitToScreen()
    }
  }, [planData])

  const handleZoomIn = () => {
    if (!stageRef.current) return
    const stage = stageRef.current
    const oldScale = stage.scaleX()
    const newScale = Math.min(oldScale * 1.2, 5) // Max 5x zoom
    
    const center = {
      x: width / 2,
      y: height / 2,
    }
    
    const newPos = {
      x: center.x - (center.x - stage.x()) * (newScale / oldScale),
      y: center.y - (center.y - stage.y()) * (newScale / oldScale),
    }
    
    setStageScale(newScale)
    setStagePos(newPos)
  }

  const handleZoomOut = () => {
    if (!stageRef.current) return
    const stage = stageRef.current
    const oldScale = stage.scaleX()
    const newScale = Math.max(oldScale / 1.2, 0.1) // Min 0.1x zoom
    
    const center = {
      x: width / 2,
      y: height / 2,
    }
    
    const newPos = {
      x: center.x - (center.x - stage.x()) * (newScale / oldScale),
      y: center.y - (center.y - stage.y()) * (newScale / oldScale),
    }
    
    setStageScale(newScale)
    setStagePos(newPos)
  }

  const handleFitToScreen = () => {
    if (!planData || !stageRef.current) return
    
    // Calculate bounds
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

    const minX = Math.min(...allX)
    const maxX = Math.max(...allX)
    const minY = Math.min(...allY)
    const maxY = Math.max(...allY)

    const planWidth = maxX - minX
    const planHeight = maxY - minY

    const scale = 15
    const scaledWidth = planWidth * scale
    const scaledHeight = planHeight * scale

    // Calculate optimal zoom with padding
    const padding = 100
    const scaleX = (width - padding * 2) / scaledWidth
    const scaleY = (height - padding * 2) / scaledHeight
    const optimalScale = Math.min(scaleX, scaleY, 1.5) // Cap at 1.5x

    setStageScale(optimalScale)
    setStagePos({ x: 0, y: 0 })
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const delta = e.evt.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.1, Math.min(oldScale * delta, 5))

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }

    setStageScale(newScale)
    setStagePos(newPos)
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setStagePos({
      x: e.target.x(),
      y: e.target.y(),
    })
  }

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

  // Calculate bounds for centering - ADAPTIVE SCALE approach
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

  // ADAPTIVE SCALE: Calculate scale based on floor plan dimensions
  // Ensures minimum visual size for all floor plans (small apartments get scaled up)
  // while preventing over-magnification of very small floor plans
  const scaleX = ADAPTIVE_SCALE.minDisplayWidth / planWidth
  const scaleY = ADAPTIVE_SCALE.minDisplayHeight / planHeight
  const minRequiredScale = Math.max(scaleX, scaleY)
  
  // Apply constraints: enforce min/max scale limits
  const scale = Math.max(
    ADAPTIVE_SCALE.minScale,
    Math.min(minRequiredScale, ADAPTIVE_SCALE.maxScale)
  )
  
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
    <div className="relative" style={{ width, height }}>
      {/* Zoom Controls */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomIn}
          className="h-10 w-10 bg-white shadow-lg hover:bg-gray-100"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomOut}
          className="h-10 w-10 bg-white shadow-lg hover:bg-gray-100"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleFitToScreen}
          className="h-10 w-10 bg-white shadow-lg hover:bg-gray-100"
        >
          <Maximize2 className="h-5 w-5" />
        </Button>
        <div className="rounded-md bg-white px-2 py-1 text-center text-xs font-medium shadow-lg">
          {Math.round(stageScale * 100)}%
        </div>
      </div>

      {/* Konva Stage */}
      <Stage 
        width={width} 
        height={height} 
        ref={stageRef}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
      >
      <Layer>
        {/* Clean white background like Maket.ai */}
        <Rect
          x={-width}
          y={-height}
          width={width * 3}
          height={height * 3}
          fill="#ffffff"
        />
      </Layer>

      <Layer>
        {/* Rooms first - white background like Maket.ai */}
        {planData.rooms.map((room, index) => {
          const centerX = room.x * scale + offsetX + (room.width * scale) / 2
          const centerY = room.y * scale + offsetY + (room.height * scale) / 2
          
          // Calculate room dimensions
          const area = (room.width * room.height).toFixed(1)
          const dimensions = `${room.width.toFixed(1)}m × ${room.height.toFixed(1)}m`
          
          return (
            <Group key={`room-${index}`}>
              {/* Room fill - pure white */}
              <Rect
                x={room.x * scale + offsetX}
                y={room.y * scale + offsetY}
                width={room.width * scale}
                height={room.height * scale}
                fill="#ffffff"
              />
              
              {/* Room name - clean and simple */}
              <Text
                x={centerX}
                y={centerY - 10}
                text={room.name}
                fontSize={13}
                fontFamily="Arial, sans-serif"
                fontStyle="bold"
                fill="#1a1a1a"
                align="center"
                offsetX={room.width * scale / 2}
              />
              
              {/* Room dimensions - width × height */}
              <Text
                x={centerX}
                y={centerY + 5}
                text={dimensions}
                fontSize={10}
                fontFamily="Arial, sans-serif"
                fill="#666666"
                align="center"
                offsetX={room.width * scale / 2}
              />
              
              {/* Room area - square meters */}
              <Text
                x={centerX}
                y={centerY + 18}
                text={`${area} m²`}
                fontSize={10}
                fontFamily="Arial, sans-serif"
                fill="#666666"
                align="center"
                offsetX={room.width * scale / 2}
              />
              
              {/* Furniture symbols - professional style */}
              {room.furniture.map((item, fIndex) => (
                <Group key={`furniture-${index}-${fIndex}`}>
                  {renderFurnitureShape(item, room, fIndex, scale, offsetX, offsetY)}
                </Group>
              ))}
            </Group>
          )
        })}

        {/* Walls - bold black lines like Maket.ai (4px for canvas to match SVG 6px visual weight) */}
        {planData.walls.map((wall, index) => {
          return (
            <Line
              key={`wall-${index}`}
              points={[
                wall.x1 * scale + offsetX,
                wall.y1 * scale + offsetY,
                wall.x2 * scale + offsetX,
                wall.y2 * scale + offsetY,
              ]}
              stroke="#000000"
              strokeWidth={STROKE_CONFIG.canvas.wallStroke}
              lineCap="square"
            />
          )
        })}

        {/* Doors - professional style like Maket.ai (calibrated for canvas rendering) */}
        {planData.doors.map((door, index) => {
          const doorX = door.x * scale + offsetX
          const doorY = door.y * scale + offsetY
          const doorWidth = 18 * (scale / 2)
          const angle = door.rotation
          
          return (
            <Group key={`door-${index}`} x={doorX} y={doorY} rotation={angle}>
              {/* Door opening - white gap in wall (reduced to 6px for canvas) */}
              <Line
                points={[0, 0, doorWidth, 0]}
                stroke="#ffffff"
                strokeWidth={STROKE_CONFIG.canvas.doorGapStroke}
                lineCap="butt"
              />
              {/* Door swing arc (increased to 2.5px to balance with thinner walls) */}
              <Line
                points={[
                  0, 0,
                  doorWidth * 0.7, -doorWidth * 0.7,
                ]}
                stroke="#000000"
                strokeWidth={STROKE_CONFIG.canvas.doorArcStroke}
                dash={[3, 3]}
              />
            </Group>
          )
        })}

        {/* Windows - Maket.ai style (4px black line for canvas to match SVG 6px visual weight) */}
        {planData.windows.map((window, index) => (
          <Group key={`window-${index}`}>
            {/* Window - thick black line matching wall thickness */}
            <Line
              points={[
                window.x * scale + offsetX,
                window.y * scale + offsetY,
                window.x * scale + offsetX + window.width * scale,
                window.y * scale + offsetY,
              ]}
              stroke="#000000"
              strokeWidth={STROKE_CONFIG.canvas.windowStroke}
              lineCap="square"
            />
          </Group>
        ))}
      </Layer>
      </Stage>
    </div>
  )
}

// Professional furniture rendering function - Maket.ai style with geometric symbols
function renderFurnitureShape(
  item: string,
  room: { x: number; y: number; width: number; height: number },
  index: number,
  scale: number,
  offsetX: number,
  offsetY: number
) {
  const roomX = room.x * scale + offsetX
  const roomY = room.y * scale + offsetY
  const roomWidth = room.width * scale
  const roomHeight = room.height * scale
  
  // Position furniture with 15px padding from room edges (Maket.ai standard)
  // Distribute across 6 predefined locations for optimal placement
  const padding = 15
  const positions = [
    { x: roomX + padding, y: roomY + padding }, // Top-left
    { x: roomX + roomWidth - 40, y: roomY + padding }, // Top-right
    { x: roomX + padding, y: roomY + roomHeight - 45 }, // Bottom-left
    { x: roomX + roomWidth - 40, y: roomY + roomHeight - 45 }, // Bottom-right
    { x: roomX + roomWidth / 2 - 15, y: roomY + padding }, // Top-center
    { x: roomX + roomWidth / 2 - 15, y: roomY + roomHeight - 45 }, // Bottom-center
  ]
  
  const pos = positions[index % positions.length]
  const type = item.toLowerCase()
  
  // Bed - Rectangle with pillow line (30px × 40px)
  if (type === 'bed') {
    return (
      <>
        <Rect 
          x={pos.x} 
          y={pos.y} 
          width={30} 
          height={40} 
          fill="none" 
          stroke="#000000" 
          strokeWidth={STROKE_CONFIG.canvas.furnitureStroke} 
        />
        <Line
          points={[pos.x, pos.y, pos.x + 30, pos.y]}
          stroke="#666666"
          strokeWidth={STROKE_CONFIG.canvas.furnitureStroke}
        />
      </>
    )
  }
  
  // Sofa - Rectangle with backrest rectangle (35px × 20px)
  if (type === 'sofa') {
    return (
      <>
        <Rect 
          x={pos.x} 
          y={pos.y} 
          width={35} 
          height={20} 
          fill="none" 
          stroke="#000000" 
          strokeWidth={STROKE_CONFIG.canvas.furnitureStroke} 
        />
        <Rect 
          x={pos.x} 
          y={pos.y} 
          width={35} 
          height={5} 
          fill="#000000" 
        />
      </>
    )
  }
  
  // Table/Dining Table - Circle (radius: 12px)
  if (type.includes('table')) {
    return (
      <Circle 
        x={pos.x + 15} 
        y={pos.y + 15} 
        radius={12} 
        fill="none" 
        stroke="#000000" 
        strokeWidth={2} 
      />
    )
  }
  
  // Toilet - Circle + small rectangle (tank)
  if (type === 'toilet') {
    return (
      <>
        <Circle 
          x={pos.x + 10} 
          y={pos.y + 12} 
          radius={8} 
          fill="none" 
          stroke="#000000" 
          strokeWidth={2} 
        />
        <Rect 
          x={pos.x + 8} 
          y={pos.y + 3} 
          width={4} 
          height={6} 
          fill="none" 
          stroke="#000000" 
          strokeWidth={STROKE_CONFIG.canvas.furnitureStroke} 
        />
      </>
    )
  }
  
  // Sink/Bathtub/Shower - Rectangle (25px × 18px)
  if (type === 'sink' || type === 'bathtub' || type === 'shower') {
    return (
      <Rect 
        x={pos.x} 
        y={pos.y} 
        width={25} 
        height={18} 
        fill="none" 
        stroke="#000000" 
        strokeWidth={2} 
      />
    )
  }
  
  // Stove/Refrigerator - Rectangle with detail circles (20px × 25px)
  if (type === 'stove' || type === 'refrigerator') {
    return (
      <>
        <Rect 
          x={pos.x} 
          y={pos.y} 
          width={20} 
          height={25} 
          fill="none" 
          stroke="#000000" 
          strokeWidth={2} 
        />
        <Circle 
          x={pos.x + 6} 
          y={pos.y + 8} 
          radius={3} 
          fill="none" 
          stroke="#000000" 
          strokeWidth={1} 
        />
        <Circle 
          x={pos.x + 14} 
          y={pos.y + 8} 
          radius={3} 
          fill="none" 
          stroke="#000000" 
          strokeWidth={1} 
        />
      </>
    )
  }
  
  // Chair - Small square (12px × 12px)
  if (type === 'chair') {
    return (
      <Rect 
        x={pos.x} 
        y={pos.y} 
        width={12} 
        height={12} 
        fill="none" 
        stroke="#000000" 
        strokeWidth={STROKE_CONFIG.canvas.furnitureStroke} 
      />
    )
  }
  
  // Default - Small circle (radius: 8px)
  return (
    <Circle 
      x={pos.x + 10} 
      y={pos.y + 10} 
      radius={8} 
      fill="none" 
      stroke="#000000" 
      strokeWidth={STROKE_CONFIG.canvas.furnitureStroke} 
    />
  )
}
