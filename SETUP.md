# PlotSync - Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- OpenRouter API key

### 2. Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### 3. Database Setup

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb plotsync
```

Update `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/plotsync"
```

**Option B: Cloud PostgreSQL (Recommended)**
- [Neon](https://neon.tech) - Free tier available
- [Supabase](https://supabase.com) - Free tier available
- [Railway](https://railway.app) - Free tier available

**Run migrations:**
```bash
npx prisma migrate dev --name init
```

### 4. Environment Variables

Update `.env` with your values:

```env
# Database (use your actual connection string)
DATABASE_URL="postgresql://username:password@host:5432/database"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OpenRouter
OPENROUTER_API_KEY="sk-or-v1-..."
```

**Generate NextAuth Secret:**
```bash
openssl rand -base64 32
```

**Get OpenRouter API Key:**
1. Go to https://openrouter.ai/
2. Sign up for an account
3. Navigate to Keys section
4. Create a new API key
5. Add credits ($5 minimum)

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Testing the Application

### 1. Landing Page
- Visit http://localhost:3000
- Check hero section, features, pricing, and FAQ

### 2. Create Account
- Click "Get Started" or "Sign Up"
- Fill in name, email, password
- Submit form

### 3. Generate Floor Plan
- Login with your credentials
- Click "New Project" from dashboard
- Set parameters:
  - Unit: Metric or Imperial
  - Total Area: e.g., 150 m²
  - Floors: 1-3
  - Room counts
- Click "Generate Floor Plans"
- Wait for AI generation (10-30 seconds)

### 4. View & Export
- Browse through variations using carousel
- Click tabs to see different proposals
- Save to project with heart icon
- Export to DXF for CAD software

## Project Structure

```
app/
├── (auth)/              # Authentication pages
│   ├── login/
│   └── signup/
├── api/                 # API routes
│   ├── auth/           # NextAuth & signup
│   ├── generate-floor-plan/  # AI generation
│   ├── projects/       # Save projects
│   └── export/         # DXF export
├── dashboard/          # User projects list
├── editor/[projectId]/ # Floor plan editor
└── page.tsx            # Landing page

components/
├── editor/             # Editor components
│   ├── floor-plan-canvas.tsx
│   ├── parameter-sidebar.tsx
│   └── action-buttons.tsx
├── landing/            # Landing page sections
├── ui/                 # Radix UI components
└── providers.tsx       # Session provider

prisma/
└── schema.prisma       # Database schema
```

## Features Implemented

✅ Landing page with hero, features, pricing, FAQ
✅ Authentication (signup/login) with NextAuth
✅ User dashboard with project list
✅ Floor plan editor with:
  - Parameter controls (unit, area, floors, rooms)
  - AI generation via OpenRouter
  - Konva.js canvas rendering
  - Multiple proposals and variations
  - Variation carousel navigation
✅ Action buttons (save, rearrange, edit, export)
✅ DXF export functionality
✅ Database persistence with Prisma
✅ Toast notifications
✅ Loading states
✅ Dark theme styling
✅ Responsive design

## Common Issues & Solutions

### Database Connection Error
```
Error: P1001: Can't reach database server
```
**Solution:** Check DATABASE_URL in `.env` and ensure PostgreSQL is running.

### OpenRouter API Error
```
Error: 401 Unauthorized
```
**Solution:** Verify OPENROUTER_API_KEY in `.env` and check account has credits.

### Prisma Client Not Found
```
Error: @prisma/client did not initialize yet
```
**Solution:** Run `npx prisma generate`

### Module Not Found
```
Error: Cannot find module '@/...'
```
**Solution:** Check tsconfig.json has correct paths, restart dev server

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/signout` - Logout user

### Floor Plans
- `POST /api/generate-floor-plan` - Generate AI floor plans
  ```json
  {
    "totalArea": 150,
    "unit": "metric",
    "floors": 1,
    "rooms": {
      "bedroom": 3,
      "bathroom": 2,
      "kitchen": 1,
      "livingRoom": 1,
      "diningRoom": 1
    }
  }
  ```

### Projects
- `POST /api/projects/save` - Save floor plan project
  ```json
  {
    "projectName": "My Floor Plan",
    "proposals": [[variations...]]
  }
  ```

### Export
- `POST /api/export/dxf` - Export floor plan to DXF
  ```json
  {
    "planData": { walls, rooms, doors, windows }
  }
  ```

## Database Schema

```prisma
User {
  id        String
  email     String (unique)
  name      String?
  password  String
  projects  Project[]
}

Project {
  id        String
  userId    String
  name      String
  proposals Proposal[]
}

Proposal {
  id         String
  projectId  String
  label      String
  variations FloorPlan[]
}

FloorPlan {
  id         String
  proposalId String
  planData   Json
  thumbnail  String?
}
```

## Technology Choices

### Why OpenRouter?
- Access to multiple AI models including Gemini
- Simple API, similar to OpenAI
- Pay-per-use pricing
- No vendor lock-in

### Why Konva.js?
- High-performance 2D canvas rendering
- React integration with react-konva
- Interactive elements (zoom, pan, drag)
- Export capabilities

### Why Prisma?
- Type-safe database queries
- Auto-generated TypeScript types
- Easy migrations
- Great developer experience

### Why Radix UI?
- Accessible components
- Unstyled primitives
- Full keyboard navigation
- WAI-ARIA compliant

## Development Tips

### Hot Reload
Changes to files automatically trigger reload except:
- `.env` changes - restart server
- `prisma/schema.prisma` - run `npx prisma generate`

### Debugging
- Check browser console for client errors
- Check terminal for server errors
- Use React DevTools for component inspection
- Use Prisma Studio for database inspection:
  ```bash
  npx prisma studio
  ```

### Performance
- Canvas renders are optimized with React.memo
- Database queries use Prisma's efficient caching
- Images should be optimized with Next.js Image component

## Production Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Environment Variables to Set
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production URL)
- `OPENROUTER_API_KEY`

### Database Migration
```bash
npx prisma migrate deploy
```

## Support & Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [Konva.js Documentation](https://konvajs.org/docs/)

## License

MIT License - See LICENSE file for details
