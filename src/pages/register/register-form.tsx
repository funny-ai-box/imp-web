import {
      Form,
      Input,
      Button,
      Space,
      Typography,
    } from '@arco-design/web-react';
    import { FormInstance } from '@arco-design/web-react/es/Form';
    import { IconLock, IconUser, IconPhone } from '@arco-design/web-react/icon';
    import React, { useRef, useState } from 'react';
    import { register } from '@/utils/http';
    import styles from './style/index.module.less';
    
    export default function RegisterForm() {
      const formRef = useRef<FormInstance>();
      const [errorMessage, setErrorMessage] = useState('');
      const [loading, setLoading] = useState(false);
    
      function onSubmitClick() {
        formRef.current.validate().then((values) => {
          handleRegister(values);
        });
      }
    
      async function handleRegister(params) {
        setErrorMessage('');
        setLoading(true);
        
        try {
          await register({
            phone: params.phone,
            password: params.password,
            username: params.username,
          });
          
          // 注册成功后重定向到登录页
          window.location.href = '/login?registered=true';
        } catch (error) {
          setErrorMessage(error.message || '注册失败，请重试');
        } finally {
          setLoading(false);
        }
      }
    
      return (
        <div className={styles['login-form-wrapper']}>
          <div className={styles['login-form-title']}>注册 Arco Design Pro 账号</div>
          <div className={styles['login-form-sub-title']}>
            创建账号开始使用
          </div>
          <div className={styles['login-form-error-msg']}>{errorMessage}</div>
          <Form
            className={styles['login-form']}
            layout="vertical"
            ref={formRef}
          >
            <Form.Item
              field="username"
              rules={[{ required: true, message: '用户名不能为空' }]}
            >
              <Input
                prefix={<IconUser />}
                placeholder="请输入用户名"
              />
            </Form.Item>
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
              />
            </Form.Item>
            <Form.Item
              field="password"
              rules={[
                { required: true, message: '密码不能为空' },
                { 
                  minLength: 6, 
                  message: '密码长度不能少于6位' 
                }
              ]}
            >
              <Input.Password
                prefix={<IconLock />}
                placeholder="请输入密码"
              />
            </Form.Item>
            <Form.Item
              field="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                {
                  validator: (value, callback) => {
                    if (!value) {
                      return callback();
                    }
                    if (value !== formRef.current?.getFieldValue('password')) {
                      callback('两次输入的密码不一致');
                    }
                    callback();
                  },
                },
              ]}
            >
              <Input.Password
                prefix={<IconLock />}
                placeholder="请再次输入密码"
                onPressEnter={onSubmitClick}
              />
            </Form.Item>
            <Space size={16} direction="vertical">
              <Button type="primary" long onClick={onSubmitClick} loading={loading}>
                注册
              </Button>
              <div className={styles['form-actions']}>
                <Typography.Text type="secondary">
                  已有账号？
                </Typography.Text>
                <Button 
                  type="text"
                  onClick={() => {
                    window.location.href = '/login';
                  }}
                >
                  登录
                </Button>
              </div>
            </Space>
          </Form>
        </div>
      );
    }