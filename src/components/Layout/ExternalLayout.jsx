import React from 'react';
import { Layout, Typography } from 'antd';
import { Outlet } from 'react-router-dom';

const { Content, Footer } = Layout;
const { Title } = Typography;

// Simple layout for external pages without the sidebar and authentication
const ExternalLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content>
        <Outlet />
      </Content>
     
    </Layout>
  );
};

export default ExternalLayout;