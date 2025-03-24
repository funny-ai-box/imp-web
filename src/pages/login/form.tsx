import {
  Form,
  Input,
  Checkbox,
  Link,
  Button,
  Space,
  Message,
} from '@arco-design/web-react';
import { FormInstance } from '@arco-design/web-react/es/Form';
import { IconLock, IconPhone } from '@arco-design/web-react/icon';
import React, { useEffect, useRef, useState } from 'react';
import { login } from '@/utils/http';
import useStorage from '@/utils/useStorage';
import { useLocation, useHistory } from 'react-router-dom';
import styles from './style/index.module.less';

export default function LoginForm() {
  const formRef = useRef<FormInstance>();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginParams, setLoginParams, removeLoginParams] =
    useStorage('loginParams');
  const location = useLocation();
  const history = useHistory();

  const [rememberPassword, setRememberPassword] = useState(!!loginParams);

  // 检查是否从注册页面重定向
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('registered') === 'true') {
      Message.success('注册成功！请登录。');
    }
  }, [location]);

  function afterLoginSuccess(params) {
    // 记住密码
    if (rememberPassword) {
      setLoginParams(JSON.stringify({
        phone: params.phone,
        // 出于安全考虑，不存储实际密码
        password: '******',
      }));
    } else {
      removeLoginParams();
    }
    
    // 记录登录状态
    localStorage.setItem('userStatus', 'login');
    
    // 跳转首页
    window.location.href = '/';
  }

  async function handleLogin(values) {
    setErrorMessage('');
    setLoading(true);
    
    try {
      await login({
        phone: values.phone,
        password: values.password,
      });
      
      afterLoginSuccess(values);
    } catch (error) {
      setErrorMessage(error.message || '登录失败，请重试');
      setLoading(false);
    }
  }

  function onSubmitClick() {
    formRef.current.validate().then((values) => {
      handleLogin(values);
    });
  }

  // 读取 localStorage，设置初始值
  useEffect(() => {
    const rememberPassword = !!loginParams;
    setRememberPassword(rememberPassword);
    if (formRef.current && rememberPassword) {
      try {
        const parseParams = JSON.parse(loginParams);
        formRef.current.setFieldsValue({
          phone: parseParams.phone,
          // 不填充密码字段，出于安全考虑
        });
      } catch (error) {
        console.error('解析登录参数失败:', error);
      }
    }
  }, [loginParams]);

  return (
    <div className={styles['login-form-wrapper']}>
      <div className={styles['login-form-title']}>登录 Arco Design Pro</div>
      <div className={styles['login-form-sub-title']}>
        登录您的账户
      </div>
      <div className={styles['login-form-error-msg']}>{errorMessage}</div>
      <Form
        className={styles['login-form']}
        layout="vertical"
        ref={formRef}
        initialValues={{ phone: '', password: '' }}
      >
        <Form.Item
          field="phone"
          rules={[
            { required: true, message: '手机号不能为空' },
            { 
              match: /^1[3-9]\d{9}$/, 
              message: '请输入有效的手机号' 
            }
          ]}
        >
          <Input
            prefix={<IconPhone />}
            placeholder="请输入手机号"
            onPressEnter={onSubmitClick}
          />
        </Form.Item>
        <Form.Item
          field="password"
          rules={[{ required: true, message: '密码不能为空' }]}
        >
          <Input.Password
            prefix={<IconLock />}
            placeholder="请输入密码"
            onPressEnter={onSubmitClick}
          />
        </Form.Item>
        <Space size={16} direction="vertical">
          <div className={styles['login-form-password-actions']}>
            <Checkbox checked={rememberPassword} onChange={setRememberPassword}>
              记住密码
            </Checkbox>
            <Link>忘记密码</Link>
          </div>
          <Button type="primary" long onClick={onSubmitClick} loading={loading}>
            登录
          </Button>
          <Button
            type="text"
            long
            className={styles['login-form-register-btn']}
            onClick={() => {
              history.push('/register');
            }}
          >
            注册账号
          </Button>
        </Space>
      </Form>
    </div>
  );
}