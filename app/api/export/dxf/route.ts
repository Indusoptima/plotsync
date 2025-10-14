import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { planData } = await request.json()

    if (!planData) {
      return NextResponse.json({ error: "No plan data provided" }, { status: 400 })
    }

    // Generate DXF content
    const dxfContent = generateDXF(planData)

    return new NextResponse(dxfContent, {
      headers: {
        "Content-Type": "application/dxf",
        "Content-Disposition": `attachment; filename="floor-plan-${Date.now()}.dxf"`,
      },
    })
  } catch (error) {
    console.error("DXF export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

function generateDXF(planData: any): string {
  let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LTYPE
70
1
0
LTYPE
2
CONTINUOUS
70
0
3
Solid line
72
65
73
0
40
0.0
0
ENDTAB
0
TABLE
2
LAYER
70
2
0
LAYER
2
WALLS
70
0
62
7
6
CONTINUOUS
0
LAYER
2
ROOMS
70
0
62
4
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`

  // Add walls as lines
  planData.walls?.forEach((wall: any) => {
    dxf += `0
LINE
8
WALLS
10
${wall.x1}
20
${wall.y1}
30
0.0
11
${wall.x2}
21
${wall.y2}
31
0.0
`
  })

  // Add rooms as polylines
  planData.rooms?.forEach((room: any) => {
    dxf += `0
LWPOLYLINE
8
ROOMS
90
4
70
1
10
${room.x}
20
${room.y}
10
${room.x + room.width}
20
${room.y}
10
${room.x + room.width}
20
${room.y + room.height}
10
${room.x}
20
${room.y + room.height}
`

    // Add room label as text
    dxf += `0
TEXT
8
ROOMS
10
${room.x + room.width / 2}
20
${room.y + room.height / 2}
30
0.0
40
1.0
1
${room.name}
`
  })

  // Add doors
  planData.doors?.forEach((door: any) => {
    dxf += `0
LINE
8
WALLS
10
${door.x}
20
${door.y}
30
0.0
11
${door.x + 30}
21
${door.y}
31
0.0
`
  })

  // Add windows
  planData.windows?.forEach((window: any) => {
    dxf += `0
LINE
8
WALLS
10
${window.x}
20
${window.y}
30
0.0
11
${window.x + window.width}
21
${window.y}
31
0.0
`
  })

  dxf += `0
ENDSEC
0
EOF
`

  return dxf
}
