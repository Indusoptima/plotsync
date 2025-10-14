import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectName, proposals } = await request.json()

    // Create project with proposals and variations
    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name: projectName,
        proposals: {
          create: proposals.map((proposalVariations: any[], index: number) => ({
            label: `${index + 1}${getOrdinalSuffix(index + 1)} proposal`,
            variations: {
              create: proposalVariations.map((variation: any) => ({
                planData: variation,
              })),
            },
          })),
        },
      },
      include: {
        proposals: {
          include: {
            variations: true,
          },
        },
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Save project error:", error)
    return NextResponse.json(
      { error: "Failed to save project" },
      { status: 500 }
    )
  }
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) return "st"
  if (j === 2 && k !== 12) return "nd"
  if (j === 3 && k !== 13) return "rd"
  return "th"
}
