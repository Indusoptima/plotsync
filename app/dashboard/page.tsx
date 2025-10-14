import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Folder } from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const projects = await prisma.project.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      proposals: {
        include: {
          variations: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800 bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600"></div>
              <span className="text-xl font-bold text-white">PlotSync</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400">{session.user.email}</span>
              <Link href="/api/auth/signout">
                <Button variant="ghost">Sign Out</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Projects</h1>
            <p className="mt-2 text-zinc-400">Manage your floor plan projects</p>
          </div>
          
          <Link href="/editor/new">
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 py-20">
            <Folder className="mb-4 h-16 w-16 text-zinc-700" />
            <h3 className="mb-2 text-xl font-semibold text-white">No projects yet</h3>
            <p className="mb-6 text-zinc-400">Create your first floor plan to get started</p>
            <Link href="/editor/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: any) => (
              <Link
                key={project.id}
                href={`/editor/${project.id}`}
                className="group rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="mb-4 flex h-40 items-center justify-center rounded-md bg-zinc-800">
                  <Folder className="h-16 w-16 text-zinc-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{project.name}</h3>
                <p className="text-sm text-zinc-400">
                  {project.proposals.length} proposal{project.proposals.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-zinc-500">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
