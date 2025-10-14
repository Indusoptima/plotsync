# PlotSync - AI Floor Plan Generator

A complete Maket.ai clone built with Next.js 14, featuring AI-powered residential floor plan generation.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **UI Components**: Radix UI Primitives
- **Styling**: Tailwind CSS
- **Canvas Rendering**: Konva.js & react-konva
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI Model**: OpenRouter API with google/gemini-2.0-flash-001

## 📋 Features

✅ **Landing Page**
- Hero section with gradient design
- Features showcase
- Pricing cards (Free & Pro tiers)
- FAQ accordion
- Responsive design

✅ **Authentication System**
- Sign up / Login with NextAuth
- Secure password hashing with bcrypt
- Protected routes

✅ **Floor Plan Generator**
- AI-powered floor plan generation
- Parameter controls (unit system, total area, floors, room counts)
- Multiple proposals and variations
- Interactive canvas rendering with Konva.js

✅ **Editor Interface**
- Left: Konva.js canvas with floor plans
- Right: Parameter sidebar with controls
- Bottom: Variation carousel
- Action buttons (Save, Rearrange, Edit, Export)

✅ **Export Functionality**
- DXF file export for CAD software

## 🛠️ Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Database Setup

The project uses PostgreSQL with Prisma. Update your `.env` file with your database connection:

\`\`\`env
DATABASE_URL="your-postgresql-connection-string"
\`\`\`

Run Prisma migrations:

\`\`\`bash
npx prisma migrate dev --name init
npx prisma generate
\`\`\`

### 3. Environment Variables

Update the `.env` file with your credentials:

\`\`\`env
# Database
DATABASE_URL="your-postgresql-connection-string"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenRouter API
OPENROUTER_API_KEY="your-openrouter-api-key"
\`\`\`

**Getting an OpenRouter API Key:**
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Generate an API key from your dashboard
4. Add credits to your account

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

\`\`\`
plotsync/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── api/
│   │   ├── auth/
│   │   ├── generate-floor-plan/
│   │   └── export/
│   ├── dashboard/
│   ├── editor/[projectId]/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── editor/
│   │   ├── action-buttons.tsx
│   │   ├── floor-plan-canvas.tsx
│   │   └── parameter-sidebar.tsx
│   ├── landing/
│   │   ├── faq.tsx
│   │   ├── features.tsx
│   │   ├── hero.tsx
│   │   ├── navbar.tsx
│   │   └── pricing.tsx
│   ├── ui/ (Radix UI components)
│   └── providers.tsx
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
└── types/
    └── next-auth.d.ts
\`\`\`

## 🎨 Key Features Explained

### AI Floor Plan Generation

The system uses OpenRouter's Gemini 2.0 Flash model to generate floor plans based on:
- Total area (metric/imperial)
- Number of floors
- Room quantities (bedrooms, bathrooms, kitchen, living room, dining room)

Each generation creates 5 variations with:
- Walls array (coordinates)
- Rooms array (with furniture)
- Doors and windows

### Canvas Rendering

Konva.js renders:
- ✅ Walls (thick black lines)
- ✅ Room labels
- ✅ Furniture symbols (emoji-based)
- ✅ Doors (arc indicators)
- ✅ Windows (blue lines)
- ✅ Dotted grid background

### Database Schema

\`\`\`
User → Project → Proposal → FloorPlan
\`\`\`

- **User**: Authentication and profile
- **Project**: Container for floor plan projects
- **Proposal**: Different layout proposals
- **FloorPlan**: Individual variations with JSON data

## 🔐 Authentication Flow

1. User signs up with email/password
2. Password hashed with bcrypt
3. NextAuth creates JWT session
4. Protected routes check session
5. User accesses dashboard and editor

## 📤 Export System

The DXF export converts floor plan JSON to AutoCAD-compatible format:
- Walls as LINE entities
- Rooms as POLYLINE entities
- Labels as TEXT entities
- Proper layer organization

## 🎯 Pro Features

- Advanced Edit Mode (manual editing)
- Unlimited generations
- Priority AI processing
- Commercial license

## 🚧 Future Enhancements

- [ ] 3D visualization
- [ ] Material selection
- [ ] Cost estimation
- [ ] Collaboration features
- [ ] Mobile app
- [ ] AR preview

## 📝 License

MIT License - Feel free to use this project for learning and development.

## 🙏 Credits

Built as a Maket.ai clone for educational purposes.

---

**Need Help?**
- Check the FAQ section on the landing page
- Review the code comments
- Open an issue on GitHub
