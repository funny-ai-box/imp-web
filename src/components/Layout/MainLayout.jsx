import { useState } from 'react';
import { Layout, Menu, Button, Typography } from 'antd';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  BookOutlined,
  LogoutOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // Determine which menu item should be selected based on current path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return '1';
    if (path.startsWith('/knowledge-bases')) return '2';
    if (path.startsWith('/foundation-models')) return '3';
    return '1'; // Default to home
  };

  // Define menu items
  const menuItems = [
    {
      key: '1',
      icon: <HomeOutlined />,
      label: <Link to="/">Home</Link>,
    },
    {
      key: '2',
      icon: <BookOutlined />,
      label: <Link to="/knowledge-bases">Knowledge Bases</Link>,
    },
    {
      key: '3',
      icon: <ApiOutlined />,
      label: <Link to="/foundation-models">Foundation Models</Link>,
    },
  ];

  // If not authenticated, don't render the main layout at all
  // This is handled by the ProtectedRoute component in App.jsx
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white' }}>
          IMP-SERVER
        </div>
        <Menu 
          theme="dark" 
          selectedKeys={[getSelectedKey()]} 
          mode="inline" 
          items={menuItems} 
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#001529' }}>
          <Title level={3} style={{color: 'white', margin: 0}}>IMP Client</Title>
          <div>
            {isAuthenticated && (
              <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
                Logout
              </Button>
            )}
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;