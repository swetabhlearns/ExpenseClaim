# Expense Claim Portal

A modern, four-tier expense claim approval system built with React, TypeScript, Convex, and Tailwind CSS.

## 🚀 Live Demo

**Frontend:** [Your Vercel URL]
**Backend:** https://cheerful-starfish-174.convex.cloud

## ✨ Features

- 🔐 Email/password authentication
- 📝 Employee claim submission
- ✅ Four-tier approval workflow (L1 → L2 → L3 → L4)
- ⚡ Real-time updates across all users
- 🎨 Modern UI with Tailwind CSS & Shadcn UI
- 📊 Approval timeline visualization
- 💾 Cloud database with Convex

## 🏗️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Convex (Real-time database)
- **UI:** Shadcn UI + Tailwind CSS
- **Deployment:** Vercel (Frontend) + Convex Cloud (Backend)

## 🧪 Demo Accounts

- **Employee:** rahul.sharma@company.com
- **L1 Admin:** priya.patel@company.com
- **L2 Admin:** amit.kumar@company.com
- **L3 Admin:** sneha.reddy@company.com
- **L4 Admin:** vikram.singh@company.com

**Password:** any value (demo mode)

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start Convex dev server
npx convex dev

# Start Vite dev server (in another terminal)
npm run dev
```

Visit http://localhost:5173

## 📦 Deployment

See [deployment.md](./deployment.md) for detailed deployment instructions.

**Quick Steps:**
1. Deploy Convex: `npx convex deploy`
2. Seed production DB: `npx convex run seed:seedData --prod`
3. Deploy to Vercel with env var: `VITE_CONVEX_URL=https://cheerful-starfish-174.convex.cloud`

## 📝 License

MIT
