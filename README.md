# Task Management Frontend

A modern, responsive, and dynamic frontend application built for the Task Management System. It uses the latest cutting-edge technologies like **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS v4** to deliver an incredibly fast and beautiful user interface.

---

## 🚀 Technologies Used
- **Next.js 16**: The React framework for production with App Router support.
- **React 19**: Library for building interactive user interfaces.
- **TypeScript**: Static typing for safer and more predictable code.
- **Tailwind CSS 4**: Utility-first CSS framework for rapid UI development.
- **Lucide React**: Beautiful and consistent icon set.
- **Recharts**: Composable charting library for dashboard analytics.
- **ESLint & PostCSS**: Linting and CSS processing.

---

## 📂 Code Structure

This project follows Next.js App Router conventions and modular design principles.

```text
ph-test/
├── app/                        # Next.js App Router root
│   ├── (auth)/                 # Authentication routes (login, register)
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── _components/        # Dashboard-specific shared components
│   │   ├── activity/           # Activity feed page
│   │   ├── analytics/          # Data analytics and charts page
│   │   ├── dashboard/          # Main dashboard overview page
│   │   ├── profile/            # User profile management
│   │   ├── projects/           # Project management interfaces
│   │   ├── tasks/              # Task tracking and Kanban boards
│   │   ├── team/               # Team members view
│   │   └── user-management/    # Admin user management panel
│   ├── _components/            # Global UI components (buttons, modals, etc.)
│   ├── _lib/                   # Global utilities and helpers
│   ├── api/                    # Next.js Route Handlers (if applicable)
│   ├── globals.css             # Global Tailwind and custom styles
│   ├── layout.tsx              # Root application layout
│   └── page.tsx                # Landing or default entry page
├── data/                       # Static mock data or JSON configs
├── public/                     # Static assets like images and fonts
├── tailwind.config.ts / CSS    # Tailwind configuration
└── next.config.ts              # Next.js configuration settings
```

---

## ⚙️ Environment Variables (`.env.local`)

To run this frontend smoothly, especially when connecting to the backend API, you might need a `.env.local` file in your root directory. 

Create a `.env.local` file with the following example variables (adjust according to your backend settings):

```env
# The base URL of your backend API
NEXT_PUBLIC_API_URL="http://localhost:8321/api/v1"

# JWT Secret if utilizing Next.js middleware for token verification
JWT_SECRET="your_jwt_secret_key"
```
*(Note: Change `NEXT_PUBLIC_API_URL` if your backend is hosted online.)*

---

## 🛠️ How to Use (Local Setup)

### 1. Install Dependencies
Ensure you have Node.js installed, then install the packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file at the root of the frontend project and add your API backend URL and other secrets.

### 3. Run the Development Server
Start the frontend development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The development server supports hot-module-reloading, so your changes will appear instantly.

### 4. Build for Production
When you are ready to deploy the application, build it:
```bash
npm run build
```
And to start the production server locally:
```bash
npm run start
```
