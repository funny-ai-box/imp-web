import React from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { loginUser } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const { Title } = Typography;

const LoginPage = () => {
  const { login } = useAuth();

  const onFinish = async (values) => {
    try {
      const response = await loginUser(values);
      // Assuming API returns { data: { token: "..." } }
      if (response.data && response.data.token) {
        login(response.data.token);
        message.success('Login successful!');
      } else {
        // If API returns empty {} as per doc, this will be the case
        message.warning('Login successful, but no token received from API. Assuming implicit auth or demo.');
        // For demo purposes, let's set a dummy token if API is vague
        login("dummy_token_if_api_returns_empty_object");
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card title={<Title level={3}>Login</Title>} style={{ width: 400 }}>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="phone"
            rules={[{ required: true, message: 'Please input your Phone!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Phone" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              Log in
            </Button>
          </Form.Item>
          Or <Link to="/register">register now!</Link>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;