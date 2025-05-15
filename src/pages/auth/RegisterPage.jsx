import React from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { registerUser } from '../../api'; // Fixed path
import { useNavigate, Link } from 'react-router-dom';

const { Title } = Typography;

const RegisterPage = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const response = await registerUser({
        phone: values.phone,
        password: values.password,
        username: values.username,
      });
      
      // 检查后端返回的code字段
      if (response.data && response.data.code === 200) {
        message.success('注册成功！请登录。');
        navigate('/login');
      } else {
        // 后端返回了非200的业务错误码
        message.error(response.data.message || '注册失败，请重试。');
      }
    } catch (error) {
      if (error.message === '公钥未设置，请先获取公钥') {
        message.error('注册前需要先获取加密公钥，请重试');
      } else if (error.message?.includes('加密失败')) {
        message.error('密码加密失败，请重试');
      } else {
        message.error(error.response?.data?.message || error.message || '注册失败。请重试。');
      }
    }
  };

  return (
    <Card title={<Title level={3}>Register</Title>}>
      <Form name="register" onFinish={onFinish}>
        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Please input your Username!' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Username" />
        </Form.Item>
        <Form.Item
          name="phone"
          rules={[{ required: true, message: 'Please input your Phone!' }]}
        >
          <Input prefix={<PhoneOutlined />} placeholder="Phone" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your Password!' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>
        <Form.Item
          name="confirm"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords that you entered do not match!'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            Register
          </Button>
        </Form.Item>
        Already have an account? <Link to="/login">Login here!</Link>
      </Form>
    </Card>
  );
};

export default RegisterPage;