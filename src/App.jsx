import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import KnowledgeBasesPage from './pages/KnowledgeBasesPage';
import KnowledgeBaseDetailPage from './pages/KnowledgeBaseDetailPage';
import FoundationModelsPage from './pages/FoundationModelsPage';
// Placeholder for a public query page if you decide to implement it
// import PublicQueryPage from './pages/PublicQueryPage'; 


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
       <Router>
    <AuthProvider>
   
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route 
              path="knowledge-bases" 
              element={<ProtectedRoute><KnowledgeBasesPage /></ProtectedRoute>} 
            />
            <Route 
              path="knowledge-bases/:kbId/*" // Allows nested routes within KB Detail
              element={<ProtectedRoute><KnowledgeBaseDetailPage /></ProtectedRoute>}
            />
            <Route
              path="foundation-models"
              element={<ProtectedRoute><FoundationModelsPage /></ProtectedRoute>}
            />
            {/* Example for a public query page route - component needs to be created */}
            {/* <Route path="public-query/:kbId" element={<PublicQueryPage />} /> */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
   
    </AuthProvider>
       </Router>
  );
}

export default App;