import React from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { registerUser } from '../../api';
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
    <Card title={<Title level={3}>用户注册</Title>}>
      <Form name="register" onFinish={onFinish}>
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入您的用户名！' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="用户名" />
        </Form.Item>
        <Form.Item
          name="phone"
          rules={[{ required: true, message: '请输入您的手机号！' }]}
        >
          <Input prefix={<PhoneOutlined />} placeholder="手机号" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入您的密码！' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="密码" />
        </Form.Item>
        <Form.Item
          name="confirm"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: '请确认您的密码！' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不匹配！'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            注册
          </Button>
        </Form.Item>
        已有账号？<Link to="/login">立即登录!</Link>
      </Form>
    </Card>
  );
};

export default RegisterPage;