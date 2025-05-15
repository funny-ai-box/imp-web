import React from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { loginUser } from '../../api'; // Fixed path
import { useAuth } from '../../contexts/AuthContext'; // Fixed path
import { Link } from 'react-router-dom';

const { Title } = Typography;

const LoginPage = () => {
  const { login } = useAuth();

  const onFinish = async (values) => {
    try {
      const response = await loginUser(values);
      // 检查后端返回的code字段
      if (response.data && response.data.code === 200) {
        if (response.data.data && response.data.data.token) {
          login(response.data.data.token);
          message.success('登录成功！');
        } else {
          // 虽然code是200但没有token
          message.warning('登录成功，但未接收到令牌。假设为演示模式。');
          login("dummy_token_for_demo");
        }
      } else {
        // 后端返回了非200的业务错误码
        message.error(response.data.message || '登录失败，请检查账号和密码。');
      }
    } catch (error) {
      if (error.message === '公钥未设置，请先获取公钥') {
        message.error('登录前需要先获取加密公钥，请重试');
      } else if (error.message?.includes('加密失败')) {
        message.error('密码加密失败，请重试');
      } else {
        message.error(error.response?.data?.message || error.message || '登录失败。请重试。');
      }
    }
  };

  return (
    <Card title={<Title level={3}>Login</Title>}>
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
  );
};

export default LoginPage;