# ERJEM Cash Flow Management System

A modern, full-featured cash flow management application built with React, TypeScript, TailwindCSS, and Prisma with PostgreSQL.

## 🚀 Features

### Multi-Branch Support
- Manage multiple business branches (ERJEM Glass, ERJEM Machine Shop, etc.)
- Switch between branches seamlessly
- Independent data for each branch

### Dashboard
- Year-to-year comparison with dual year selectors
- Current month vs last month analytics
- KPI cards with trend indicators
- Interactive charts and visualizations

### Personal Expenses
- Track personal expenses separately
- Filter by month and year
- Category breakdown with pie charts
- Personal expense ratio calculation

### Monthly Comparison
- Side-by-side month comparison
- Percentage change indicators (Expenses, Income, Profit)
- Detailed breakdown of Expenses, Income, Profit, and Savings

### Database Management
- Full CRUD operations on all transactions
- Advanced search and filtering
- Bulk actions (delete, export, modify)
- Pagination and sorting
- Export to Excel/CSV/PDF

### Data Upload
- **Bulk Import**: Upload Excel/CSV files with historical data
- **Quick Add**: Manual single transaction entry
- **Daily Upload**: Small batch uploads for daily transactions
- Recent upload history

### Additional Features
- 🌓 Dark mode support
- 📱 Fully responsive (mobile, tablet, desktop)
- 🔐 Custom authentication with bcrypt
- �️ PostgreSQL database with Prisma ORM
- 🎨 Modern UI with TailwindCSS and shadcn/ui
- 📊 Interactive charts with Recharts
- 🔔 Toast notifications

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Backend**: Prisma ORM + PostgreSQL
- **API**: Vercel Serverless Functions
- **Authentication**: Custom with bcrypt
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **File Parsing**: Papa Parse (CSV) + XLSX (Excel)
- **Routing**: React Router v6
- **Build Tool**: Vite

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/crynxmartinez/ERJEM-Cash-Management-System.git
cd "ERJEM Cash Flow Management System"
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the root directory:
```env
DATABASE_URL=postgres://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST:5432/YOUR_DATABASE?sslmode=require
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## �️ Database Schema

### Prisma Models

#### `Branch`
```typescript
{
  id: string
  name: string
  displayName: string
  createdAt: Timestamp
  createdBy: string
  isActive: boolean
  settings: {
    currency: string
    fiscalYearStart: number
  }
}
```

#### `Transaction`
```typescript
{
  id: string
  userId: string
  branchId: string
  branchName: string
  date: Timestamp
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  source: string
  isPersonal: boolean
  entryMethod: 'bulk' | 'manual' | 'daily-upload'
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `User`
```typescript
{
  id: string
  email: string
  displayName: string
  createdAt: Timestamp
}
```

#### `UserBranch`
```typescript
{
  id: string
  userId: string
  branchId: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: Timestamp
}
```

### API Routes

The application uses Vercel serverless functions for API endpoints:

- `/api/auth/login` - User authentication
- `/api/auth/register` - User registration
- `/api/branches` - Branch management
- `/api/transactions` - Transaction CRUD operations
- `/api/users` - User management
- `/api/import-csv` - CSV import for single branch
- `/api/import-csv-branches` - CSV import for multiple branches

## 📱 Usage

### First Time Setup

1. **Register**: Create an account with email and password
2. **Login**: Sign in with your credentials
3. **Default Branches**: Two default branches are automatically created:
   - ERJEM Glass
   - ERJEM Machine Shop

### Adding Transactions

#### Method 1: Bulk Import
1. Go to **Upload** tab
2. Click **Bulk Import**
3. Upload Excel (.xlsx, .xls) or CSV file
4. Preview and confirm import

#### Method 2: Quick Add
1. Go to **Upload** tab
2. Fill in the Quick Add form
3. Click **Save** or **Save & Add Another**

#### Method 3: Daily Upload
1. Prepare a CSV with today's transactions
2. Go to **Upload** tab
3. Click **Daily Upload**
4. Select your CSV file

### Managing Data

1. Go to **Database** tab
2. Use search and filters to find transactions
3. Click **Edit** (✏️) to modify a transaction
4. Click **Delete** (🗑️) to remove a transaction
5. Select multiple rows for bulk actions
6. Click **Export** to download data

### Viewing Analytics

1. **Dashboard**: View year-to-year and month-to-month comparisons
2. **Personal**: Track personal expenses separately
3. **Monthly**: Compare two specific months side-by-side

## 🎨 UI Features

- **Dark Mode**: Toggle between light and dark themes
- **Responsive**: Works on mobile, tablet, and desktop
- **Sidebar Navigation**: Easy access to all features
- **Branch Selector**: Switch between branches in the navbar
- **Loading States**: Smooth loading indicators
- **Toast Notifications**: Real-time feedback for actions

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub

2. Import project in Vercel dashboard

3. Set environment variables:
   - `DATABASE_URL` - Your PostgreSQL connection string

4. Deploy:
```bash
vercel deploy
```

## 📄 License

This project is private and proprietary.

## 👥 Authors

- **ERJEM Team**

## 🙏 Acknowledgments

- Prisma for database ORM
- Vercel for hosting and serverless functions
- TailwindCSS for styling
- shadcn/ui for components
- Recharts for data visualization
