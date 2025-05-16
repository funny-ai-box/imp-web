import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import AuthLayout from './components/Layout/AuthLayout';
import ExternalLayout from './components/Layout/ExternalLayout';
import routerConfig from './router';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth routes - using AuthLayout */}
          <Route element={<AuthLayout />}>
            {routerConfig.authRoutes.map((route, index) => (
              <Route 
                key={`auth-route-${index}`} 
                path={route.path} 
                element={route.element} 
              />
            ))}
          </Route>
             <Route element={<ExternalLayout />}>
            {routerConfig.externalRoutes.map((route, index) => (
              <Route 
                key={`external-route-${index}`} 
                path={route.path} 
                element={route.element} 
              />
            ))}
          </Route>

          {/* Main app routes - using MainLayout */}
          <Route element={<MainLayout />}>
            {routerConfig.mainRoutes.map((route, index) => (
              <Route 
                key={`main-route-${index}`} 
                path={route.path} 
                element={route.element} 
              />
            ))}
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;