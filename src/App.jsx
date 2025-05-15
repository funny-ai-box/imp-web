
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/auth/LoginPage'; // Fixed path
import RegisterPage from './pages/auth/RegisterPage'; // Fixed path
import HomePage from './pages/HomePage';
import KnowledgeBasesPage from './pages/kn/KnowledgeBasesPage'; // Fixed path
import KnowledgeBaseDetailPage from './pages/kn/KnowledgeBaseDetailPage'; // Fixed path
import FoundationModelsPage from './pages/FoundationModelsPage';
import AuthLayout from './components/Layout/AuthLayout'; // We'll create this for login/register
import ProtectedRoute from './components/Route/ProtectedRoute'; // We'll create this for clarity

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth routes with AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Main layout with protected routes */}
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="knowledge-bases" element={
              <ProtectedRoute>
                <KnowledgeBasesPage />
              </ProtectedRoute>
            } />
            <Route path="knowledge-bases/:kbId/*" element={
              <ProtectedRoute>
                <KnowledgeBaseDetailPage />
              </ProtectedRoute>
            } />
            <Route path="foundation-models" element={
              <ProtectedRoute>
                <FoundationModelsPage />
              </ProtectedRoute>
            } />
            <Route path="public-query/:kbId" element={<div>Public Query Page (To be implemented)</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;