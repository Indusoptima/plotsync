import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import OpenAI from "openai"

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
})

interface FloorPlanRequest {
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params: FloorPlanRequest = await request.json()

    const prompt = `You are an expert residential architect. Create a COMPLETE, REALISTIC floor plan (not just one room!) with the following specifications:

**Requirements:**
- Total Area: ${params.totalArea} ${params.unit === "metric" ? "m²" : "ft²"}
- Number of Floors: ${params.floors} (generate floor 1 only)
- Bedrooms: ${params.rooms.bedroom}
- Bathrooms: ${params.rooms.bathroom}
- Kitchen: ${params.rooms.kitchen}
- Living Room: ${params.rooms.livingRoom}
- Dining Room: ${params.rooms.diningRoom}

**CRITICAL INSTRUCTIONS:**
1. Generate 5 DIFFERENT complete floor plan variations
2. Each floor plan must include ALL rooms specified above
3. Create a COMPLETE rectangular building outline with exterior walls
4. All rooms must be INSIDE the building outline
5. Use realistic room dimensions (bedrooms: 12-20m², bathrooms: 4-8m², living: 20-40m², kitchen: 10-15m², dining: 12-18m²)
6. Include interior walls separating rooms
7. Add doors between rooms and entrance door
8. Add windows on exterior walls
9. Include realistic furniture for each room type

**Floor Plan Structure:**
Each variation must have:
- **walls**: Complete building outline + interior partition walls
  - Exterior walls forming a rectangle/L-shape
  - Interior walls dividing spaces
  - Format: {x1, y1, x2, y2} in meters
  
- **rooms**: ALL required rooms with proper dimensions
  - Each room must have: name, x, y, width, height
  - Include appropriate furniture array for room type
  - Bedrooms: ["bed", "wardrobe", "desk"]
  - Bathrooms: ["toilet", "sink", "shower"]
  - Kitchen: ["stove", "refrigerator", "sink"]
  - Living Room: ["sofa", "tv", "table"]
  - Dining Room: ["dining table", "chairs"]
  
- **doors**: Entry door + interior doors
  - Entry door on exterior wall
  - Doors between connected rooms
  - Format: {x, y, rotation} where rotation is 0, 90, 180, or 270
  
- **windows**: On exterior walls for natural light
  - At least 2-3 windows per floor plan
  - Format: {x, y, width} where width is typically 10-20 units

**Example Layout Pattern:**
- Entrance → Hallway/Corridor
- Living Room near entrance (public zone)
- Dining Room connected to living room and kitchen
- Kitchen with access to dining area
- Bedrooms in private zone (away from entrance)
- Bathrooms near bedrooms
- Proper circulation space (hallways/corridors)

**Return Format:**
Return ONLY a valid JSON array with 5 variations. NO explanations, NO markdown.

[
  {
    "walls": [
      {"x1": 0, "y1": 0, "x2": 100, "y2": 0},
      {"x1": 100, "y1": 0, "x2": 100, "y2": 50},
      {"x1": 100, "y1": 50, "x2": 0, "y2": 50},
      {"x1": 0, "y1": 50, "x2": 0, "y2": 0},
      {"x1": 50, "y1": 0, "x2": 50, "y2": 50}
    ],
    "rooms": [
      {"name": "Living Room", "x": 5, "y": 5, "width": 40, "height": 20, "furniture": ["sofa", "tv", "table"]},
      {"name": "Kitchen", "x": 5, "y": 28, "width": 20, "height": 17, "furniture": ["stove", "refrigerator", "sink"]},
      {"name": "Dining Room", "x": 28, "y": 28, "width": 17, "height": 17, "furniture": ["dining table", "chairs"]},
      {"name": "Bedroom 1", "x": 55, "y": 5, "width": 40, "height": 20, "furniture": ["bed", "wardrobe", "desk"]},
      {"name": "Bathroom 1", "x": 55, "y": 28, "width": 40, "height": 17, "furniture": ["toilet", "sink", "shower"]}
    ],
    "doors": [
      {"x": 20, "y": 0, "rotation": 0},
      {"x": 50, "y": 25, "rotation": 90},
      {"x": 25, "y": 25, "rotation": 90}
    ],
    "windows": [
      {"x": 80, "y": 0, "width": 15},
      {"x": 20, "y": 50, "width": 15},
      {"x": 75, "y": 50, "width": 15}
    ]
  }
]`

    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: "You are an expert architect and floor plan designer. Generate detailed, realistic floor plans in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      throw new Error("No response from AI")
    }

    // Parse the JSON response
    let variations
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      variations = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error("Failed to parse AI response:", content)
      // Generate fallback floor plans
      variations = generateFallbackFloorPlans(params)
    }

    return NextResponse.json({ variations })
  } catch (error) {
    console.error("Floor plan generation error:", error)
    
    // Return fallback floor plans on error
    const params: FloorPlanRequest = await request.json()
    const variations = generateFallbackFloorPlans(params)
    
    return NextResponse.json({ variations })
  }
}

function generateFallbackFloorPlans(params: FloorPlanRequest) {
  const variations = []
  
  // Calculate realistic building dimensions based on total area
  const totalRooms = Object.values(params.rooms).reduce((a, b) => a + b, 0)
  const avgRoomArea = params.totalArea / Math.max(totalRooms, 1)
  
  // Create proportional building with ~1.5:1 ratio (width:height)
  const buildingWidth = Math.sqrt(params.totalArea * 1.5)
  const buildingHeight = Math.sqrt(params.totalArea / 1.5)

  for (let i = 0; i < 5; i++) {
    const variation: any = {
      walls: [],
      rooms: [],
      doors: [],
      windows: [],
    }

    // EXTERIOR WALLS - Create complete building outline
    variation.walls = [
      { x1: 0, y1: 0, x2: buildingWidth, y2: 0 }, // Top wall
      { x1: buildingWidth, y1: 0, x2: buildingWidth, y2: buildingHeight }, // Right wall
      { x1: buildingWidth, y1: buildingHeight, x2: 0, y2: buildingHeight }, // Bottom wall
      { x1: 0, y1: buildingHeight, x2: 0, y2: 0 }, // Left wall
    ]

    // LAYOUT STRATEGY: Divide building into zones
    const roomConfigs = []
    let currentX = 0
    let currentY = 0
    
    // Variation-specific layouts
    if (i === 0) {
      // Linear layout - rooms side by side
      const roomWidth = buildingWidth / totalRooms
      
      // Add Living Room
      if (params.rooms.livingRoom > 0) {
        const width = roomWidth * 2 // Living room takes 2x space
        roomConfigs.push({
          name: "Living Room",
          x: currentX + 1,
          y: 1,
          width: width - 2,
          height: buildingHeight - 2,
          furniture: ["sofa", "tv", "table"]
        })
        currentX += width
      }
      
      // Add Dining Room
      if (params.rooms.diningRoom > 0) {
        roomConfigs.push({
          name: "Dining Room",
          x: currentX + 1,
          y: 1,
          width: roomWidth * 1.5 - 2,
          height: buildingHeight / 2 - 2,
          furniture: ["dining table", "chairs"]
        })
        
        // Add Kitchen below dining
        if (params.rooms.kitchen > 0) {
          roomConfigs.push({
            name: "Kitchen",
            x: currentX + 1,
            y: buildingHeight / 2 + 1,
            width: roomWidth * 1.5 - 2,
            height: buildingHeight / 2 - 2,
            furniture: ["stove", "refrigerator", "sink"]
          })
        }
        currentX += roomWidth * 1.5
      } else if (params.rooms.kitchen > 0) {
        roomConfigs.push({
          name: "Kitchen",
          x: currentX + 1,
          y: 1,
          width: roomWidth - 2,
          height: buildingHeight - 2,
          furniture: ["stove", "refrigerator", "sink"]
        })
        currentX += roomWidth
      }
      
      // Add Bedrooms
      for (let j = 0; j < params.rooms.bedroom; j++) {
        roomConfigs.push({
          name: `Bedroom ${j + 1}`,
          x: currentX + 1,
          y: 1,
          width: roomWidth - 2,
          height: buildingHeight * 0.6 - 2,
          furniture: ["bed", "wardrobe", "desk"]
        })
        
        // Add bathroom with bedroom if available
        if (j < params.rooms.bathroom) {
          roomConfigs.push({
            name: `Bathroom ${j + 1}`,
            x: currentX + 1,
            y: buildingHeight * 0.6 + 1,
            width: roomWidth - 2,
            height: buildingHeight * 0.4 - 2,
            furniture: ["toilet", "sink", "shower"]
          })
        }
        currentX += roomWidth
      }
      
      // Add remaining bathrooms
      for (let j = params.rooms.bedroom; j < params.rooms.bathroom; j++) {
        if (currentX + roomWidth <= buildingWidth) {
          roomConfigs.push({
            name: `Bathroom ${j + 1}`,
            x: currentX + 1,
            y: 1,
            width: roomWidth - 2,
            height: buildingHeight - 2,
            furniture: ["toilet", "sink", "shower"]
          })
          currentX += roomWidth
        }
      }
    } else {
      // Grid layout - rooms in 2 rows
      const numCols = Math.ceil(totalRooms / 2)
      const colWidth = buildingWidth / numCols
      const rowHeight = buildingHeight / 2
      
      let col = 0
      let row = 0
      
      // Add Living Room (takes 2 columns)
      if (params.rooms.livingRoom > 0) {
        roomConfigs.push({
          name: "Living Room",
          x: col * colWidth + 1,
          y: row * rowHeight + 1,
          width: colWidth * 2 - 2,
          height: rowHeight - 2,
          furniture: ["sofa", "tv", "table"]
        })
        col += 2
      }
      
      // Add Dining Room
      if (params.rooms.diningRoom > 0) {
        if (col >= numCols) {
          col = 0
          row = 1
        }
        roomConfigs.push({
          name: "Dining Room",
          x: col * colWidth + 1,
          y: row * rowHeight + 1,
          width: colWidth - 2,
          height: rowHeight - 2,
          furniture: ["dining table", "chairs"]
        })
        col++
      }
      
      // Add Kitchen
      if (params.rooms.kitchen > 0) {
        if (col >= numCols) {
          col = 0
          row = 1
        }
        roomConfigs.push({
          name: "Kitchen",
          x: col * colWidth + 1,
          y: row * rowHeight + 1,
          width: colWidth - 2,
          height: rowHeight - 2,
          furniture: ["stove", "refrigerator", "sink"]
        })
        col++
      }
      
      // Add Bedrooms
      for (let j = 0; j < params.rooms.bedroom; j++) {
        if (col >= numCols) {
          col = 0
          row = 1
        }
        roomConfigs.push({
          name: `Bedroom ${j + 1}`,
          x: col * colWidth + 1,
          y: row * rowHeight + 1,
          width: colWidth - 2,
          height: rowHeight - 2,
          furniture: ["bed", "wardrobe", "desk"]
        })
        col++
      }
      
      // Add Bathrooms
      for (let j = 0; j < params.rooms.bathroom; j++) {
        if (col >= numCols) {
          col = 0
          row = 1
        }
        roomConfigs.push({
          name: `Bathroom ${j + 1}`,
          x: col * colWidth + 1,
          y: row * rowHeight + 1,
          width: colWidth - 2,
          height: rowHeight - 2,
          furniture: ["toilet", "sink", "shower"]
        })
        col++
      }
    }
    
    variation.rooms = roomConfigs

    // INTERIOR WALLS - Create walls between rooms
    const processedWalls = new Set()
    for (let j = 0; j < roomConfigs.length; j++) {
      const room = roomConfigs[j]
      
      // Right wall of room
      const rightWallKey = `${room.x + room.width}-${room.y}-${room.x + room.width}-${room.y + room.height}`
      if (!processedWalls.has(rightWallKey) && room.x + room.width < buildingWidth - 1) {
        variation.walls.push({
          x1: room.x + room.width,
          y1: room.y,
          x2: room.x + room.width,
          y2: room.y + room.height
        })
        processedWalls.add(rightWallKey)
      }
      
      // Bottom wall of room
      const bottomWallKey = `${room.x}-${room.y + room.height}-${room.x + room.width}-${room.y + room.height}`
      if (!processedWalls.has(bottomWallKey) && room.y + room.height < buildingHeight - 1) {
        variation.walls.push({
          x1: room.x,
          y1: room.y + room.height,
          x2: room.x + room.width,
          y2: room.y + room.height
        })
        processedWalls.add(bottomWallKey)
      }
    }

    // DOORS - Entry + interior doors
    variation.doors.push(
      { x: buildingWidth * 0.3, y: 0, rotation: 0 } // Main entrance
    )
    
    // Add interior doors between adjacent rooms
    for (let j = 0; j < Math.min(roomConfigs.length - 1, 3); j++) {
      const room = roomConfigs[j]
      variation.doors.push({
        x: room.x + room.width,
        y: room.y + room.height / 2,
        rotation: 90
      })
    }

    // WINDOWS - On exterior walls
    const numWindows = Math.max(3, Math.floor(totalRooms / 2))
    for (let j = 0; j < numWindows; j++) {
      const wallSide = j % 4
      if (wallSide === 0) { // Top wall
        variation.windows.push({
          x: (buildingWidth / (numWindows + 1)) * (j + 1),
          y: 0,
          width: 15
        })
      } else if (wallSide === 2) { // Bottom wall
        variation.windows.push({
          x: (buildingWidth / (numWindows + 1)) * (j + 1),
          y: buildingHeight,
          width: 15
        })
      }
    }

    variations.push(variation)
  }

  return variations
}
