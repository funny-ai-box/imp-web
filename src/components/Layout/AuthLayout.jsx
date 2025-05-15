import React from 'react';
import { Layout, Typography } from 'antd';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Content } = Layout;
const { Title } = Typography;

// Simple layout for auth pages without the sidebar
const AuthLayout = () => {
  const { isAuthenticated } = useAuth();

  // If user is already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 500, padding: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2}>IMP-SERVER Client</Title>
          </div>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};

export default AuthLayout;