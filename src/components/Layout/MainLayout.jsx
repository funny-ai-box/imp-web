import React from 'react';
import { Layout, Menu, Button, Typography } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  BookOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserAddOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    {
      key: '1',
      icon: <HomeOutlined />,
      label: <Link to="/">Home</Link>,
    },
    ...(isAuthenticated
      ? [
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
        ]
      : []),
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white' }}>
          IMP-SERVER
        </div>
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={menuItems} />
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{color: 'white', margin: 0}}>IMP Client</Title>
          <div>
            {!isAuthenticated ? (
              <>
                <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate('/login')} style={{ marginRight: 8 }}>
                  Login
                </Button>
                <Button icon={<UserAddOutlined />} onClick={() => navigate('/register')}>
                  Register
                </Button>
              </>
            ) : (
              <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
                Logout
              </Button>
            )}
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;