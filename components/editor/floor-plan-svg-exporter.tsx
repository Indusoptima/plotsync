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
}

export function FloorPlanSVGExporter({ planData, width = 800, height = 600 }: FloorPlanSVGExporterProps) {
  if (!planData || planData.walls.length === 0) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        <rect width={width} height={height} fill="#f9fafb" />
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#9ca3af" fontSize="16">
          No floor plan data
        </text>
      </svg>
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
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      xmlns="http://www.w3.org/2000/svg"
      className="floor-plan-svg"
    >
      {/* Background */}
      <rect width={width} height={height} fill="#f9fafb" />

      {/* Grid pattern for reference */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
        </pattern>
        
        {/* Door arc pattern */}
        <marker id="doorArc" markerWidth="10" markerHeight="10" refX="5" refY="5">
          <circle cx="5" cy="5" r="3" fill="#8B4513" />
        </marker>
      </defs>

      <rect width={width} height={height} fill="url(#grid)" />

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
                {/* Room fill */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={roomColor}
                  fillOpacity="0.3"
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                
                {/* Room label */}
                <text
                  x={x + w / 2}
                  y={y + h / 2 - 8}
                  textAnchor="middle"
                  fill="#1e293b"
                  fontSize="12"
                  fontWeight="600"
                  style={{ userSelect: 'none' }}
                >
                  {room.name}
                </text>
                
                {/* Room area */}
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 6}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  style={{ userSelect: 'none' }}
                >
                  {area} m²
                </text>
                
                {/* Room dimensions */}
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 18}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  style={{ userSelect: 'none' }}
                >
                  {room.width.toFixed(1)}m × {room.height.toFixed(1)}m
                </text>

                {/* Furniture icons */}
                {room.furniture.map((item, furIdx) => {
                  const furnitureIcons: Record<string, string> = {
                    sofa: "🛋️",
                    bed: "🛏️",
                    table: "🪑",
                    desk: "🖥️",
                    chair: "💺",
                    toilet: "🚽",
                    bathtub: "🛁",
                    sink: "🚰",
                    stove: "🔥",
                  }
                  
                  const icon = furnitureIcons[item] || "📦"
                  const furX = x + 10 + (furIdx % 3) * 20
                  const furY = y + h - 30 + Math.floor(furIdx / 3) * 20

                  return (
                    <text
                      key={furIdx}
                      x={furX}
                      y={furY}
                      fontSize="14"
                      style={{ userSelect: 'none' }}
                    >
                      {icon}
                    </text>
                  )
                })}
              </g>
            )
          })}
        </g>

        {/* Walls */}
        <g id="walls">
          {planData.walls.map((wall, idx) => {
            const x1 = wall.x1 * scale
            const y1 = wall.y1 * scale
            const x2 = wall.x2 * scale
            const y2 = wall.y2 * scale

            // Calculate wall length
            const length = Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2))
            const midX = (x1 + x2) / 2
            const midY = (y1 + y2) / 2

            return (
              <g key={idx} id={`wall-${idx}`}>
                {/* Wall line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#334155"
                  strokeWidth="8"
                  strokeLinecap="square"
                />

                {/* Dimension label */}
                {length > 0.5 && (
                  <text
                    x={midX}
                    y={midY - 10}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="9"
                    fontWeight="500"
                    style={{ userSelect: 'none' }}
                  >
                    {length.toFixed(1)}m
                  </text>
                )}
              </g>
            )
          })}
        </g>

        {/* Doors */}
        <g id="doors">
          {planData.doors.map((door, idx) => {
            const x = door.x * scale
            const y = door.y * scale
            const doorWidth = 1.2 * scale // 1.2m door width
            const rotation = door.rotation || 0

            return (
              <g 
                key={idx} 
                id={`door-${idx}`}
                transform={`translate(${x}, ${y}) rotate(${rotation})`}
              >
                {/* Door frame */}
                <line
                  x1={0}
                  y1={0}
                  x2={doorWidth}
                  y2={0}
                  stroke="#8B4513"
                  strokeWidth="3"
                />
                
                {/* Door arc */}
                <path
                  d={`M ${doorWidth} 0 A ${doorWidth} ${doorWidth} 0 0 1 0 ${doorWidth}`}
                  fill="none"
                  stroke="#8B4513"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
              </g>
            )
          })}
        </g>

        {/* Windows */}
        <g id="windows">
          {planData.windows.map((window, idx) => {
            const x = window.x * scale
            const y = window.y * scale
            const windowWidth = (window.width || 1.5) * scale

            return (
              <g key={idx} id={`window-${idx}`}>
                {/* Window frame (double line) */}
                <line
                  x1={x}
                  y1={y - 2}
                  x2={x + windowWidth}
                  y2={y - 2}
                  stroke="#60a5fa"
                  strokeWidth="2"
                />
                <line
                  x1={x}
                  y1={y + 2}
                  x2={x + windowWidth}
                  y2={y + 2}
                  stroke="#60a5fa"
                  strokeWidth="2"
                />
              </g>
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
