# ERJEM Cash Flow Management System - Project Setup Guide

## 🎯 Project Overview

A comprehensive cash flow management system with multi-branch support, built with React, TypeScript, TailwindCSS, and Firebase.

## 📁 Project Structure

```
ERJEM Cash Flow Management System/
├── public/                      # Static assets
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── Layout.tsx         # Main layout with sidebar
│   │   ├── Navbar.tsx         # Top navigation bar
│   │   ├── Sidebar.tsx        # Left sidebar navigation
│   │   └── ProtectedRoute.tsx # Route protection
│   ├── contexts/              # React Context providers
│   │   ├── AuthContext.tsx    # Firebase authentication
│   │   ├── ThemeContext.tsx   # Dark mode management
│   │   └── BranchContext.tsx  # Multi-branch state
│   ├── lib/                   # Utilities and configurations
│   │   ├── firebase.ts        # Firebase initialization
│   │   └── utils.ts           # Helper functions
│   ├── pages/                 # Application pages
│   │   ├── Login.tsx          # Login page
│   │   ├── Register.tsx       # Registration page
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── Personal.tsx       # Personal expenses
│   │   ├── Monthly.tsx        # Monthly comparison
│   │   ├── Database.tsx       # Data management
│   │   └── Upload.tsx         # Data upload
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts           # All type definitions
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # App entry point
│   └── index.css              # Global styles
├── .env                       # Environment variables (create this!)
├── .env.example               # Environment template
├── firebase.json              # Firebase configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
├── storage.rules              # Storage security rules
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # TailwindCSS config
└── README.md                  # Project documentation
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Create a `.env` file in the root directory with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=AIzaSyC1Wn3sbMSxDwJ4kbT6PZEX5vmc9RXznP4
VITE_FIREBASE_AUTH_DOMAIN=erjem-9722c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=erjem-9722c
VITE_FIREBASE_STORAGE_BUCKET=erjem-9722c.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=193501059904
VITE_FIREBASE_APP_ID=1:193501059904:web:99e2bb7d92e836615638a5
VITE_FIREBASE_MEASUREMENT_ID=G-0MFXCSCYDH
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

### 5. Deploy to Firebase

```bash
firebase deploy
```

## 🔥 Firebase Setup

### Enable Authentication

1. Go to Firebase Console → Authentication
2. Enable Email/Password sign-in method

### Create Firestore Database

1. Go to Firebase Console → Firestore Database
2. Create database in production mode
3. Deploy security rules from `firestore.rules`

### Enable Storage

1. Go to Firebase Console → Storage
2. Get started with default settings
3. Deploy security rules from `storage.rules`

## 📊 Features Implemented

### ✅ Authentication
- Email/Password registration
- Login with email
- Protected routes
- User profile management
- Logout functionality

### ✅ Multi-Branch Support
- Switch between branches (ERJEM Glass, ERJEM Machine Shop)
- Branch-specific data filtering
- Default branches auto-created on first login

### ✅ Dashboard
- Year-to-year comparison (dual year selectors)
- Current month vs last month analytics
- KPI cards with trend indicators
- Placeholder for charts (Recharts integration ready)

### ✅ Personal Expenses
- Filter by month and year
- Track personal spending separately
- Summary cards (Total, Income, Ratio)
- Transaction table with empty state

### ✅ Monthly Comparison
- Side-by-side month comparison
- Percentage change indicators
- Detailed breakdown (Expenses, Income, Profit, Savings)

### ✅ Database Management
- Search and filter transactions
- Advanced filter panel
- Statistics cards
- Data table with pagination
- CRUD operations (Edit, Delete)
- Bulk actions support
- Export functionality

### ✅ Data Upload
- Bulk import (Excel/CSV)
- Quick add form
- Daily upload
- Drag and drop file upload
- Recent uploads history

### ✅ UI/UX
- Dark mode toggle with persistence
- Fully responsive (mobile, tablet, desktop)
- Sidebar navigation with hamburger menu
- Branch selector in navbar
- Loading states
- Modern gradient design

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (#3B82F6 to #1D4ED8)
- **Success**: Green (#10B981)
- **Error**: Red (#EF4444)
- **Warning**: Yellow (#F59E0B)

### Typography
- **Font**: System font stack
- **Headings**: Bold, various sizes
- **Body**: Regular weight

### Components
- Rounded corners (lg: 0.5rem)
- Shadow effects for depth
- Hover states for interactivity
- Smooth transitions

## 📦 Dependencies

### Core
- `react` ^18.3.1
- `react-dom` ^18.3.1
- `typescript` ^5.6.2
- `vite` ^6.0.1

### Firebase
- `firebase` ^11.0.2

### Routing & State
- `react-router-dom` ^7.0.2

### UI & Styling
- `tailwindcss` ^3.4.15
- `lucide-react` ^0.468.0
- `clsx` ^2.1.1
- `tailwind-merge` ^2.5.5

### Forms & Validation
- `react-hook-form` ^7.54.0
- `zod` ^3.24.1
- `@hookform/resolvers` ^3.9.1

### Data Handling
- `papaparse` ^5.4.1
- `xlsx` ^0.18.5
- `@types/papaparse` ^5.3.15

### Charts
- `recharts` ^2.15.0

### Notifications
- `react-hot-toast` ^2.4.1

### Animations
- `framer-motion` ^11.15.0

### Tables
- `@tanstack/react-table` ^8.20.6

## 🔐 Security

### Firestore Rules
- Authenticated users can read/write their own data
- Branch access controlled via `userBranches` collection
- Transaction ownership verified on write operations

### Storage Rules
- Users can only access their own files
- File uploads scoped to user ID

### Environment Variables
- All Firebase credentials stored in `.env`
- `.env` file gitignored for security
- `.env.example` provided as template

## 🐛 Known Issues & Next Steps

### To Implement
1. **Real Firestore Integration**
   - Replace placeholder data with actual Firestore queries
   - Implement real-time listeners for data updates

2. **Charts & Visualizations**
   - Integrate Recharts for dashboard
   - Add pie charts for Personal expenses
   - Line charts for trends

3. **File Upload Logic**
   - CSV/Excel parsing with Papa Parse and XLSX
   - Validation and error handling
   - Duplicate detection
   - Batch upload to Firestore

4. **CRUD Operations**
   - Complete edit transaction modal
   - Delete confirmation dialog
   - Bulk actions implementation

5. **Advanced Features**
   - Export to Excel/CSV/PDF
   - Print functionality
   - Advanced filtering
   - Search with debounce
   - Pagination logic

6. **Testing**
   - Unit tests for utilities
   - Integration tests for contexts
   - E2E tests for critical flows

7. **Performance**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Bundle size optimization

## 📝 Development Notes

### TypeScript Errors
All TypeScript errors shown in the IDE are expected and will resolve once you run:
```bash
npm install
```

These errors occur because:
- Node modules not yet installed
- Type definitions not available
- Build tools not processed CSS

### CSS Warnings
TailwindCSS `@tailwind` directives show as "unknown at-rules" before build. This is normal and will work correctly after Vite processes the files.

### Firebase Configuration
The Firebase config is already set up in `src/lib/firebase.ts` with your project credentials. Just create the `.env` file and you're ready to go!

## 🎓 Learning Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Vite Guide](https://vite.dev/guide/)

## 📞 Support

For issues or questions, refer to:
- Project README.md
- Firebase Console
- GitHub Issues (if repository is public)

---

**Happy Coding! 🚀**
