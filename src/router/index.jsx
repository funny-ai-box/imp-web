import { Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/Route/ProtectedRoute';

// Import page components
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import KnowledgeBasesPage from '../pages/kn/KnowledgeBasesPage';
import KnowledgeBaseDetailPage from '../pages/kn/KnowledgeBaseDetailPage';
import VocBotPage from '../pages/external/VocBotPage';

import BasicConfigPage from '../pages/BasicConfigPage';

// Import icons
import {
  HomeOutlined,
  BookOutlined,

  SettingOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

// Define menu configuration with routes embedded
const menuConfig = [
  {
    key: '1',
    icon: <HomeOutlined />,
    label: '首页',
    path: '/',
    element: <HomePage />
  },
  {
    key: '2',
    icon: <BookOutlined />,
    label: '知识库',
    path: '/knowledge-bases',
    element: (
      <ProtectedRoute>
        <KnowledgeBasesPage />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/knowledge-bases/:kbId/*',
        element: (
          <ProtectedRoute>
            <KnowledgeBaseDetailPage />
          </ProtectedRoute>
        ),
        // This doesn't show in menu, only for routing
        showInMenu: false
      }
    ]
  },
 
  {
    key: '4',
    icon: <SettingOutlined />,
    label: '基础配置',
    children: [
      {
        key: '4-1', 
        icon: <AppstoreOutlined />,
        label: '大模型配置',
        path: '/basic-config/llm-config',
        element: (
          <ProtectedRoute>
            <BasicConfigPage />
          </ProtectedRoute>
        )
      }
    ]
  }
];

// Additional routes that don't appear in the menu
const additionalRoutes = [
  {
    path: "/public-query/:kbId",
    element: <div>公共查询页面 (待实现)</div>,
    showInMenu: false
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
    showInMenu: false
  }
];

// Auth routes for AuthLayout
const authRoutes = [
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/register",
    element: <RegisterPage />
  }
];
const externalRoutes = [
  {
    path: "/external/voc-bot/:app_key",
    element: <VocBotPage />
  },
  // Add other external routes here
];

// Function to extract routes from menu config
const extractRoutesFromMenu = (menuItems) => {
  const routes = [];
  
  // Helper function to process menu items recursively
  const processMenuItem = (item) => {
    // If item has a route, add it
    if (item.path && item.element) {
      routes.push({
        path: item.path,
        element: item.element
      });
    }
    
    // If item has children menu items
    if (item.children) {
      item.children.forEach(child => {
        if (child.showInMenu !== false) {
          processMenuItem(child);
        } else if (child.path && child.element) {
          // Still add the route even if not shown in menu
          routes.push({
            path: child.path,
            element: child.element
          });
        }
      });
    }
  };
  
  // Process each top level menu item
  menuItems.forEach(item => processMenuItem(item));
  
  return routes;
};

// Extract main routes from menu config
const mainRoutes = [
  ...extractRoutesFromMenu(menuConfig),
  ...additionalRoutes
];

// Export all routes and menu config
const routerConfig = {
  authRoutes,
  mainRoutes,
  externalRoutes,
  menuConfig
};

export default routerConfig;