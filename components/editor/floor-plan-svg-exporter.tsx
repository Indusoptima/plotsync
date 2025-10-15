"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

interface FloorPlanData {
  walls: Array<{ x1: number; y1: number; x2: number; y2: number }>
  rooms: Array<{
    name: string
    x: number
    y: number
    width: number
    height: number
    furniture: string[]
    material?: string
    color?: string
  }>
  doors: Array<{ x: number; y: number; rotation: number }>
  windows: Array<{ x: number; y: number; width: number }>
}

interface FloorPlanSVGExporterProps {
  planData: FloorPlanData
  width?: number
  height?: number
  interactive?: boolean
}

export function FloorPlanSVGExporter({ planData, width = 800, height = 600, interactive = true }: FloorPlanSVGExporterProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Fit to screen on mount
  useEffect(() => {
    if (!interactive) return
    handleFitToScreen()
  }, [planData, interactive])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1))
  }

  const handleFitToScreen = () => {
    if (!containerRef.current || !planData || planData.walls.length === 0) return

    const container = containerRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

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

    // Calculate zoom to fit with padding
    const padding = 100
    const zoomX = (containerWidth - padding * 2) / scaledWidth
    const zoomY = (containerHeight - padding * 2) / scaledHeight
    const optimalZoom = Math.min(zoomX, zoomY, 1.5)

    setZoom(optimalZoom)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return
    setIsPanning(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !isPanning) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (!interactive) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.1, Math.min(prev * delta, 5)))
  }

  if (!planData || planData.walls.length === 0) {
    return (
      <div ref={containerRef} className="relative h-full w-full">
        <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
          <rect width={width} height={height} fill="#f9fafb" />
          <text x={width / 2} y={height / 2} textAnchor="middle" fill="#9ca3af" fontSize="16">
            No floor plan data
          </text>
        </svg>
      </div>
    )
  }

  // Calculate bounds for centering - FIXED SCALE approach
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

  // FIXED SCALE: 15 pixels per meter
  const scale = 15

  const scaledWidth = planWidth * scale
  const scaledHeight = planHeight * scale

  // Center the floor plan in canvas
  const offsetX = (width - scaledWidth) / 2 - minX * scale
  const offsetY = (height - scaledHeight) / 2 - minY * scale

  // Material colors mapping
  const getMaterialColor = (material?: string): string => {
    const colors: Record<string, string> = {
      wood: "#8B4513",
      concrete: "#808080",
      brick: "#B22222",
      marble: "#F0F0F0",
      tile: "#D3D3D3",
      default: "#E8E8E8",
    }
    return colors[material || "default"] || colors.default
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Zoom Controls */}
      {interactive && (
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
            {Math.round(zoom * 100)}%
          </div>
        </div>
      )}

      {/* SVG Content */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <svg 
          width={width} 
          height={height} 
          viewBox={`0 0 ${width} ${height}`} 
          xmlns="http://www.w3.org/2000/svg"
          className="floor-plan-svg"
          ref={svgRef}
          style={{ display: 'block', margin: '0 auto' }}
        >
      {/* Background - clean white like Maket.ai */}
      <rect width={width} height={height} fill="#ffffff" />

      {/* Group for floor plan elements */}
      <g id="floorPlan" transform={`translate(${offsetX}, ${offsetY})`}>
        
        {/* Rooms - Draw first so walls appear on top */}
        <g id="rooms">
          {planData.rooms.map((room, idx) => {
            const roomColor = room.color || getMaterialColor(room.material)
            const x = room.x * scale
            const y = room.y * scale
            const w = room.width * scale
            const h = room.height * scale
            const area = (room.width * room.height).toFixed(1)

            return (
              <g key={idx} id={`room-${idx}-${room.name.replace(/\s+/g, '-')}`}>
                {/* Room fill - pure white */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="#ffffff"
                  stroke="none"
                />
                
                {/* Room label - professional style */}
                <text
                  x={x + w / 2}
                  y={y + h / 2}
                  textAnchor="middle"
                  fill="#1a1a1a"
                  fontSize="13"
                  fontWeight="600"
                  fontFamily="Arial, sans-serif"
                  style={{ userSelect: 'none' }}
                >
                  {room.name}
                </text>

                {/* Professional furniture shapes */}
                {room.furniture.map((item, furIdx) => {
                  return renderSVGFurniture(item, x, y, w, h, furIdx, idx)
                })}
              </g>
            )
          })}
        </g>

        {/* Walls - bold black like Maket.ai */}
        <g id="walls">
          {planData.walls.map((wall, idx) => {
            const x1 = wall.x1 * scale
            const y1 = wall.y1 * scale
            const x2 = wall.x2 * scale
            const y2 = wall.y2 * scale

            return (
              <line
                key={idx}
                id={`wall-${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#000000"
                strokeWidth="6"
                strokeLinecap="square"
              />
            )
          })}
        </g>

        {/* Doors - professional style */}
        <g id="doors">
          {planData.doors.map((door, idx) => {
            const x = door.x * scale
            const y = door.y * scale
            const doorWidth = 1.2 * scale
            const rotation = door.rotation || 0

            return (
              <g 
                key={idx} 
                id={`door-${idx}`}
                transform={`translate(${x}, ${y}) rotate(${rotation})`}
              >
                {/* Door opening - white gap */}
                <line
                  x1={0}
                  y1={0}
                  x2={doorWidth}
                  y2={0}
                  stroke="#ffffff"
                  strokeWidth="8"
                />
                
                {/* Door swing arc */}
                <path
                  d={`M ${doorWidth} 0 Q ${doorWidth * 0.7} ${-doorWidth * 0.5} 0 ${-doorWidth * 0.7}`}
                  fill="none"
                  stroke="#000000"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
              </g>
            )
          })}
        </g>

        {/* Windows - clean style */}
        <g id="windows">
          {planData.windows.map((window, idx) => {
            const x = window.x * scale
            const y = window.y * scale
            const windowWidth = (window.width || 1.5) * scale

            return (
              <line
                key={idx}
                id={`window-${idx}`}
                x1={x}
                y1={y}
                x2={x + windowWidth}
                y2={y}
                stroke="#000000"
                strokeWidth="3"
                strokeLinecap="square"
              />
            )
          })}
        </g>
      </g>

      {/* Scale indicator */}
      <g id="scaleIndicator" transform={`translate(${width - 120}, ${height - 40})`}>
        <rect x="0" y="0" width="100" height="30" fill="white" fillOpacity="0.9" stroke="#cbd5e1" strokeWidth="1" rx="4" />
        <line x1="10" y1="15" x2="10 + ${scale * 5}" y2="15" stroke="#334155" strokeWidth="2" />
        <line x1="10" y1="10" x2="10" y2="20" stroke="#334155" strokeWidth="2" />
        <line x1="${10 + scale * 5}" y1="10" x2="${10 + scale * 5}" y2="20" stroke="#334155" strokeWidth="2" />
        <text x="55" y="26" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="500">5m</text>
      </g>

      {/* Title/Metadata */}
      <g id="metadata">
        <text x="20" y="30" fill="#1e293b" fontSize="16" fontWeight="700">
          Floor Plan - {planData.rooms.length} Room{planData.rooms.length !== 1 ? 's' : ''}
        </text>
        <text x="20" y="50" fill="#64748b" fontSize="11">
          Scale: 1:{Math.round(100 / scale)} • Total Area: {planData.rooms.reduce((sum, r) => sum + r.width * r.height, 0).toFixed(1)} m²
        </text>
      </g>
        </svg>
      </div>
    </div>
  )
}

// Function to download SVG
export function downloadFloorPlanSVG(planData: FloorPlanData, filename: string = 'floor-plan.svg') {
  const svgElement = document.querySelector('.floor-plan-svg')
  if (!svgElement) return

  const svgData = new XMLSerializer().serializeToString(svgElement)
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Professional furniture rendering for SVG
function renderSVGFurniture(
  item: string,
  roomX: number,
  roomY: number,
  roomWidth: number,
  roomHeight: number,
  index: number,
  roomIndex: number
) {
  // Position furniture in different locations
  const positions = [
    { x: roomX + 15, y: roomY + 15 }, // Top-left
    { x: roomX + roomWidth - 35, y: roomY + 15 }, // Top-right
    { x: roomX + 15, y: roomY + roomHeight - 35 }, // Bottom-left
    { x: roomX + roomWidth - 35, y: roomY + roomHeight - 35 }, // Bottom-right
    { x: roomX + roomWidth / 2 - 10, y: roomY + 15 }, // Top-center
    { x: roomX + roomWidth / 2 - 10, y: roomY + roomHeight - 35 }, // Bottom-center
  ]
  
  const pos = positions[index % positions.length]
  const type = item.toLowerCase()
  const furKey = `fur-${roomIndex}-${index}`
  
  // Sofa
  if (type === 'sofa') {
    return (
      <g key={furKey}>
        <rect x={pos.x} y={pos.y} width="35" height="20" fill="#000000" stroke="#000000" strokeWidth="1" />
        <rect x={pos.x} y={pos.y} width="35" height="5" fill="#000000" />
      </g>
    )
  }
  
  // Bed
  if (type === 'bed') {
    return (
      <g key={furKey}>
        <rect x={pos.x} y={pos.y} width="30" height="40" fill="#000000" stroke="#000000" strokeWidth="1" />
        <rect x={pos.x} y={pos.y} width="30" height="8" fill="#666666" />
      </g>
    )
  }
  
  // Table
  if (type.includes('table')) {
    return (
      <circle key={furKey} cx={pos.x + 12} cy={pos.y + 12} r="12" fill="none" stroke="#000000" strokeWidth="2" />
    )
  }
  
  // Toilet
  if (type === 'toilet') {
    return (
      <g key={furKey}>
        <circle cx={pos.x + 8} cy={pos.y + 10} r="8" fill="none" stroke="#000000" strokeWidth="2" />
        <rect x={pos.x + 6} y={pos.y + 2} width="4" height="6" fill="none" stroke="#000000" strokeWidth="1.5" />
      </g>
    )
  }
  
  // Sink/Bathtub
  if (type === 'sink' || type === 'bathtub' || type === 'shower') {
    return (
      <rect key={furKey} x={pos.x} y={pos.y} width="25" height="18" fill="none" stroke="#000000" strokeWidth="2" />
    )
  }
  
  // Stove/Refrigerator
  if (type === 'stove' || type === 'refrigerator') {
    return (
      <g key={furKey}>
        <rect x={pos.x} y={pos.y} width="20" height="25" fill="none" stroke="#000000" strokeWidth="2" />
        <circle cx={pos.x + 6} cy={pos.y + 8} r="3" fill="none" stroke="#000000" strokeWidth="1" />
        <circle cx={pos.x + 14} cy={pos.y + 8} r="3" fill="none" stroke="#000000" strokeWidth="1" />
      </g>
    )
  }
  
  // Chair
  if (type === 'chair') {
    return (
      <rect key={furKey} x={pos.x} y={pos.y} width="12" height="12" fill="none" stroke="#000000" strokeWidth="1.5" />
    )
  }
  
  // Default
  return (
    <circle key={furKey} cx={pos.x + 8} cy={pos.y + 8} r="8" fill="none" stroke="#000000" strokeWidth="1.5" />
  )
}
