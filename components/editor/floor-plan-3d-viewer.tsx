"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Box, Plane } from "@react-three/drei"
import { Suspense } from "react"

interface Room {
  name: string
  x: number
  y: number
  width: number
  height: number
  furniture: string[]
  material?: string
  color?: string
}

interface Wall {
  x1: number
  y1: number
  x2: number
  y2: number
  material?: string
  color?: string
}

interface Door {
  x: number
  y: number
  rotation: number
}

interface Window {
  x: number
  y: number
  width: number
}

interface FloorPlan3DViewerProps {
  rooms: Room[]
  walls: Wall[]
  doors: Door[]
  windows: Window[]
}

function Room3D({ room }: { room: Room }) {
  const wallHeight = 3
  const wallThickness = 0.1
  
  // Convert 2D coordinates to 3D (scaling down for better view)
  const scale = 0.1
  const x = room.x * scale
  const z = room.y * scale
  const width = room.width * scale
  const depth = room.height * scale

  // Get material color
  const getMaterialColor = () => {
    if (room.color) return room.color
    switch (room.material) {
      case "wood": return "#8B4513"
      case "concrete": return "#808080"
      case "brick": return "#B22222"
      case "marble": return "#F0F0F0"
      default: return "#E8E8E8"
    }
  }

  return (
    <group position={[x + width / 2, 0, z + depth / 2]}>
      {/* Floor */}
      <Plane
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        args={[width, depth]}
      >
        <meshStandardMaterial 
          color={getMaterialColor()} 
          roughness={0.8}
          metalness={0.2}
        />
      </Plane>

      {/* Walls - Front */}
      <Box
        position={[0, wallHeight / 2, depth / 2]}
        args={[width, wallHeight, wallThickness]}
      >
        <meshStandardMaterial color="#FAFAFA" roughness={0.9} />
      </Box>

      {/* Walls - Back */}
      <Box
        position={[0, wallHeight / 2, -depth / 2]}
        args={[width, wallHeight, wallThickness]}
      >
        <meshStandardMaterial color="#FAFAFA" roughness={0.9} />
      </Box>

      {/* Walls - Left */}
      <Box
        position={[-width / 2, wallHeight / 2, 0]}
        args={[wallThickness, wallHeight, depth]}
      >
        <meshStandardMaterial color="#FAFAFA" roughness={0.9} />
      </Box>

      {/* Walls - Right */}
      <Box
        position={[width / 2, wallHeight / 2, 0]}
        args={[wallThickness, wallHeight, depth]}
      >
        <meshStandardMaterial color="#FAFAFA" roughness={0.9} />
      </Box>

      {/* Render furniture */}
      {room.furniture?.map((item, idx) => (
        <Furniture3D key={idx} type={item} index={idx} roomWidth={width} roomDepth={depth} />
      ))}
    </group>
  )
}

function Furniture3D({ 
  type, 
  index, 
  roomWidth, 
  roomDepth 
}: { 
  type: string
  index: number
  roomWidth: number
  roomDepth: number
}) {
  // Position furniture items within the room
  const positions = [
    [roomWidth * 0.3, 0.3, 0],
    [-roomWidth * 0.3, 0.3, 0],
    [0, 0.3, roomDepth * 0.3],
    [0, 0.3, -roomDepth * 0.3],
  ]

  const pos = positions[index % positions.length]

  const getFurnitureGeometry = () => {
    switch (type.toLowerCase()) {
      case "sofa":
        return { size: [1, 0.6, 0.5], color: "#4A5568" }
      case "bed":
        return { size: [1.2, 0.4, 1.8], color: "#718096" }
      case "table":
      case "dining table":
        return { size: [1, 0.05, 1], color: "#8B4513" }
      case "chair":
      case "chairs":
        return { size: [0.4, 0.6, 0.4], color: "#654321" }
      case "tv":
        return { size: [0.05, 0.6, 1], color: "#1A202C" }
      case "fridge":
      case "refrigerator":
        return { size: [0.6, 1.5, 0.6], color: "#E2E8F0" }
      case "stove":
        return { size: [0.6, 0.8, 0.6], color: "#2D3748" }
      case "wardrobe":
        return { size: [0.6, 1.8, 1.2], color: "#744210" }
      case "desk":
        return { size: [1.2, 0.7, 0.6], color: "#8B4513" }
      default:
        return { size: [0.5, 0.5, 0.5], color: "#A0AEC0" }
    }
  }

  const { size, color } = getFurnitureGeometry()

  return (
    <Box position={pos} args={size as [number, number, number]}>
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} />
    </Box>
  )
}

function Scene({ rooms, walls, doors, windows }: FloorPlan3DViewerProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.8} 
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -5]} intensity={0.3} />

      {/* Render rooms */}
      {rooms.map((room, idx) => (
        <Room3D key={idx} room={room} />
      ))}

      {/* Ground plane */}
      <Plane
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        args={[50, 50]}
        receiveShadow
      >
        <meshStandardMaterial color="#F7FAFC" roughness={1} />
      </Plane>

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  )
}

export function FloorPlan3DViewer({ rooms, walls, doors, windows }: FloorPlan3DViewerProps) {
  return (
    <div className="h-full w-full bg-gradient-to-b from-blue-50 to-blue-100">
      <Canvas
        camera={{ position: [15, 15, 15], fov: 50 }}
        shadows
      >
        <Suspense fallback={null}>
          <Scene rooms={rooms} walls={walls} doors={doors} windows={windows} />
        </Suspense>
      </Canvas>
    </div>
  )
}
