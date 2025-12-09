# Referent

A minimal Next.js application built with TypeScript and the App Router.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

Install the dependencies:

```powershell
npm install
```

### Development

Run the development server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build

Create a production build:

```powershell
npm run build
```

### Start Production Server

Start the production server:

```powershell
npm start
```

### Lint

Run the linter:

```powershell
npm run lint
```

## Project Structure

```
referent/
├── app/
│   ├── layout.tsx    # Root layout component
│   └── page.tsx      # Home page component
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── vercel.json       # Vercel deployment configuration
└── README.md         # This file
```

## Deployment

### Deploy to Vercel

This project is ready to deploy on [Vercel](https://vercel.com).

#### Option 1: Deploy via Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New Project"
4. Import your Git repository
5. Vercel will automatically detect Next.js and configure the build settings
6. Click "Deploy"

#### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI globally:
```powershell
npm install -g vercel
```

2. Login to Vercel:
```powershell
vercel login
```

3. Deploy your project:
```powershell
vercel
```

4. For production deployment:
```powershell
vercel --prod
```

The project will be automatically built and deployed. Vercel will provide you with a deployment URL.

## Technologies

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety

