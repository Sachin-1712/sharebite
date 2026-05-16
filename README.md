# Sharebite: AI-Powered Food Rescue Network

Sharebite is a professional, full-stack platform designed to bridge the gap between food donors (restaurants, grocery stores) and NGOs to minimize food waste and support local communities.

![Sharebite Banner](<img width="139" height="51" alt="image" src="https://github.com/user-attachments/assets/0ff9ae4e-783b-41cb-a2c7-e2e80e05e5e7" />)


## 🚀 Overview

Sharebite optimizes the food donation pipeline using a **Hybrid Intelligence Architecture**. By combining deterministic matching heuristics with AI-driven assistance, it ensures that surplus food is rescued and delivered to those in need with maximum efficiency and transparency.

### Key Roles
- **Donors**: Easily list surplus food with urgency levels and categories.
- **NGOs**: Receive smart match suggestions based on location, capacity, and current needs.
- **Logistics/Delivery**: Optimize rescue missions with AI-assisted routing.

## ✨ Features

- **Smart Matching Engine**: A robust heuristic algorithm that evaluates distance, NGO reliability, and capacity to provide match scores and justifications.
- **AI Chatbot Assistant**: Context-aware support powered by **Gemini 2.5 Flash** to help users navigate the platform and answer queries.
- **Dynamic Analytics Dashboard**: Real-time insights for NGOs, tracking rescued meals and donation trends directly from Supabase history.
- **AI-Assisted Routing**: Seamless integration with Google Maps for delivery optimization.
- **Premium UI/UX**: Built with the **Stitch Design System** for a high-fidelity, polished professional feel.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, Stitch Design System, Shadcn UI, Lucide React
- **Backend/Database**: Supabase (PostgreSQL), Real-time subscriptions
- **AI**: Google Gemini 2.5 Flash
- **Analytics**: Recharts
- **Deployment**: Vercel

## 🏗️ Architecture Summary

Sharebite utilizes a **Hybrid Intelligence** approach:
1. **True AI**: Gemini 2.5 Flash handles natural language queries and user assistance via `/api/chat`.
2. **Heuristic Engine**: Match suggestions are calculated via a weighted multi-signal algorithm (`store.ts`) for stability and reliability.
3. **Live Data Aggregation**: Performance metrics are computed on-the-fly from Postgres donation records to ensure data integrity.

## 🚦 Local Setup

### Prerequisites
- Node.js (Latest LTS)
- Supabase Account
- Google AI (Gemini) API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/foodbridge-platform.git
   cd foodbridge-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env.local` file in the root and add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup**:
   - Follow instructions in `docs/SUPABASE_SETUP.md` to initialize your Supabase schema.
   - Run the seed script to populate initial data:
     ```bash
     node scripts/supabase-seed.js
     ```

5. **Run the app**:
   ```bash
   npm run dev
   ```

## 🚢 Deployment (Vercel)

For a one-click deployment to Vercel, ensure you add the following Environment Variables in the Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

Refer to `DEPLOYMENT.md` for more details.

## 📈 Portfolio Highlights

- **What I Built**: A complete end-to-end food rescue platform with role-based access control, a custom matching engine, and real-time data visualization.
- **Challenges Solved**:
  - **Cold-Start Data**: Implemented a comprehensive seeding system to ensure a demo-ready state.
  - **Architecture Reliability**: Balanced AI capabilities with deterministic logic to ensure the core matching engine is 100% reliable for production-like demos.
  - **UX Consistency**: Leveraged a high-fidelity design system (Stitch) to maintain visual excellence across complex dashboards.
- **Future Improvements**:
  - Implement Row-Level Security (RLS) for production-grade data isolation.
  - Integrate Mapbox for native in-app route visualization.
  - Add OCR for automated food label scanning via Gemini Vision.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
