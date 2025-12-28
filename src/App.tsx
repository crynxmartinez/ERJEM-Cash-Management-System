import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { BranchProvider } from './contexts/BranchContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Personal from './pages/Personal'
import Monthly from './pages/Monthly'
import Database from './pages/Database'
import Upload from './pages/Upload'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BranchProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
                            <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="personal" element={<Personal />} />
                <Route path="monthly" element={<Monthly />} />
                <Route path="database" element={<Database />} />
                <Route path="upload" element={<Upload />} />
              </Route>
            </Routes>
          </Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
              },
            }}
          />
        </BranchProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
