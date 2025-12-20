# Fatty Patty Battles

A multiplayer 3D card-battling game built with React, Three.js, and Convex.

## Technology Stack

- **Runtime & Build Tool**: Bun (all-in-one toolkit)
- **Frontend**: React 19 + TypeScript
- **3D Rendering**: Three.js via @react-three/fiber
- **3D Utilities**: @react-three/drei
- **Physics**: @react-three/rapier
- **Backend**: Convex (real-time database)
- **Styling**: TailwindCSS
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Bun v1.3+ (already installed!)
- A Convex account (free at https://convex.dev)

### Setup Convex Backend

1. Run the Convex dev server (this will prompt you to create/connect a project):

```bash
bunx convex dev
```

2. Follow the prompts to:
   - Sign in to Convex (or create an account)
   - Create a new project or select an existing one
   - The command will generate a `.env.local` file with your Convex URL

### Running the Development Server

Open two terminal windows:

**Terminal 1** - Convex backend:
```bash
bunx convex dev
```

**Terminal 2** - Frontend dev server:
```bash
bun run dev
```

The app will be available at **http://localhost:3000**

## Available Commands

- `bun run dev` - Start the development server
- `bun build` - Build for production
- `bunx convex dev` - Start Convex backend in development mode

## Project Status

### ✅ Phase 1: Project Setup & Foundation - COMPLETE
- ✅ Bun runtime installed
- ✅ React + TypeScript initialized
- ✅ TailwindCSS configured
- ✅ Core dependencies installed (Three.js, Convex, Zustand, Rapier)
- ✅ Folder structure created
- ✅ Convex schema defined
- ✅ Dev server working

### 🔜 Phase 2: Authentication System - NEXT
- Set up Convex Auth
- Create signup/signin UI
- Implement user profiles
- Add avatar customization

## Database Schema

The Convex schema (`convex/schema.ts`) includes:
- **users**: User profiles with avatar customization
- **playerPositions**: Real-time player locations (for multiplayer sync)
- **cards**: Card definitions with rarities (common → admin)
- **inventory**: Player card collections
- **transactions**: Economy audit trail
- **shopPacks**: Available card packs
- **battles**: Battle records (post-MVP)

## Folder Structure

```
src/
├── components/
│   ├── auth/       # Authentication UI
│   ├── ui/         # Reusable UI components
│   ├── hud/        # Heads-up display
│   ├── shop/       # Shop UI
│   ├── world/      # 3D world components
│   └── battle/     # Battle system
├── hooks/          # Custom React hooks
├── stores/         # Zustand state stores
├── lib/
│   ├── three/      # Three.js helpers
│   └── game/       # Game logic
├── types/          # TypeScript types
└── assets/         # Static assets
```

## Game Features (MVP)

- User authentication & profiles
- 3D explorable world with real-time multiplayer
- Card collection system (10 rarities)
- Buy/Sell shops with PattyCoins economy
- Auto-battler battle system vs NPCs

## Next Steps

1. Run `bunx convex dev` to set up your Convex backend
2. Then run `bun run dev` to start the frontend
3. Begin implementing Phase 2 (Authentication)
