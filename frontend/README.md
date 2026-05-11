# ThetaGang Dashboard

A premium, high-performance dashboard for monitoring your ThetaGang trading bot. Built with Next.js, Framer Motion, and Recharts.

## Features

- **Real-time Portfolio Summary**: Track total value, change, net theta, and delta exposure.
- **Performance Analytics**: Interactive charts showing your portfolio growth over time.
- **Active Positions**: Detailed view of all your short options and equity positions.
- **Trade History**: Quick look at recent fills and cancellations.
- **Glassmorphism UI**: A stunning, modern dark-mode interface.

## Deployment to Vercel

1. **Push to GitHub**:
   Ensure your code is in a GitHub repository.
   ```bash
   git add .
   git commit -m "Add frontend dashboard"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in.
   - Click "Add New" -> "Project".
   - Import your repository.
   - Set the **Root Directory** to `frontend`.
   - Click "Deploy".

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Connecting to your Bot

Currently, the dashboard uses mock data for demonstration. To connect it to your live ThetaGang bot:

1. Update `frontend/src/lib/mockData.ts` to fetch from an API.
2. Create an API route in `frontend/src/app/api/stats/route.ts` that reads your SQLite database or a remote DB.
3. If deploying to Vercel, consider using a cloud database like **Supabase** or **Neon** to store your bot's state so the frontend can access it from anywhere.
