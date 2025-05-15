import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/auth/LoginPage'; 
import RegisterPage from './pages/auth/RegisterPage'; 
import HomePage from './pages/HomePage';
import KnowledgeBasesPage from './pages/kn/KnowledgeBasesPage'; 
import KnowledgeBaseDetailPage from './pages/kn/KnowledgeBaseDetailPage'; 
import FoundationModelsPage from './pages/FoundationModelsPage';
import BasicConfigPage from './pages/BasicConfigPage'; // 新增基础配置页面
import AuthLayout from './components/Layout/AuthLayout'; 
import ProtectedRoute from './components/Route/ProtectedRoute'; 

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* 认证路由使用 AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* 主布局中的路由，部分需要保护 */}
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
            {/* 新增基础配置路由 */}
            <Route path="basic-config/llm-config" element={
              <ProtectedRoute>
                <BasicConfigPage />
              </ProtectedRoute>
            } />
            <Route path="public-query/:kbId" element={<div>公共查询页面 (待实现)</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;