import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Button, 
  Table, 
  Space,
  Modal,
  message,
  Popconfirm,
  Tag,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 模拟管理员API - 实际项目中需要替换成真实API调用
const createLlmProvider = (data) => {
  // 这里模拟API调用成功
  return Promise.resolve({ data: { code: 200, message: '创建成功', data: { ...data, id: Date.now() } } });
};

const updateLlmProvider = (id, data) => {
  // 这里模拟API调用成功
  return Promise.resolve({ data: { code: 200, message: '更新成功', data: { ...data, id } } });
};

const deleteLlmProvider = (id) => {
  // 这里模拟API调用成功
  return Promise.resolve({ data: { code: 200, message: '删除成功' } });
};

const LlmProviderManagePage = () => {
  const [form] = Form.useForm();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);

  // 在实际应用中这里会从API获取服务商列表
  useEffect(() => {
    // 模拟数据
    const mockProviders = [
      {
        id: 1,
        name: 'OpenAI',
        provider_type: 'OpenAI',
        description: 'OpenAI API服务提供商',
        auth_type: 'api_key',
        required_fields: ['api_key'],
        optional_fields: ['api_base_url'],
        auth_description: '需要从OpenAI官网获取API密钥',
        is_active: true
      },
      {
        id: 2,
        name: '讯飞星火',
        provider_type: 'SparkDesk',
        description: '讯飞星火大模型API',
        auth_type: 'id_key_secret',
        required_fields: ['app_id', 'api_key', 'api_secret'],
        optional_fields: [],
        auth_description: '需要在讯飞开放平台创建应用并获取认证信息',
        is_active: true
      }
    ];
    setProviders(mockProviders);
  }, []);

  const handleCreate = () => {
    form.resetFields();
    setEditingProvider(null);
    setModalVisible(true);
  };

  const handleEdit = (provider) => {
    form.setFieldsValue({
      ...provider,
      required_fields: provider.required_fields?.join(', '),
      optional_fields: provider.optional_fields?.join(', ')
    });
    setEditingProvider(provider);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await deleteLlmProvider(id);
      if (response.data.code === 200) {
        message.success('删除成功');
        setProviders(providers.filter(item => item.id !== id));
      } else {
        message.error(response.data.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理字段列表
      if (values.required_fields) {
        values.required_fields = values.required_fields.split(',').map(item => item.trim()).filter(Boolean);
      } else {
        values.required_fields = [];
      }
      
      if (values.optional_fields) {
        values.optional_fields = values.optional_fields.split(',').map(item => item.trim()).filter(Boolean);
      } else {
        values.optional_fields = [];
      }
      
      setLoading(true);
      
      let response;
      if (editingProvider) {
        response = await updateLlmProvider(editingProvider.id, values);
        if (response.data.code === 200) {
          message.success('更新服务商成功');
          setProviders(providers.map(item => 
            item.id === editingProvider.id ? {...item, ...values} : item
          ));
        }
      } else {
        response = await createLlmProvider(values);
        if (response.data.code === 200) {
          message.success('创建服务商成功');
          setProviders([...providers, response.data.data]);
        }
      }
      
      setModalVisible(false);
    } catch (error) {
      message.error('表单提交失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '服务商类型',
      dataIndex: 'provider_type',
      key: 'provider_type',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '鉴权类型',
      dataIndex: 'auth_type',
      key: 'auth_type',
      render: (text) => {
        const authTypeMap = {
          'api_key': 'API密钥',
          'key_secret': '密钥对',
          'id_key_secret': 'ID和密钥对'
        };
        return authTypeMap[text] || text;
      }
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此服务商吗？"
            description="删除后无法恢复，相关配置也可能失效。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>大模型服务商管理</Title>
      <Text type="secondary">管理员可以在此页面添加、编辑和删除大模型服务商</Text>
      
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          添加服务商
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={providers}
        rowKey="id"
        loading={loading}
      />
      
      <Modal
        title={editingProvider ? '编辑服务商' : '添加服务商'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={loading}
        width={600}
        okText={editingProvider ? '更新' : '创建'}
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="服务商名称"
            rules={[{ required: true, message: '请输入服务商名称!' }]}
          >
            <Input placeholder="例如: OpenAI" />
          </Form.Item>
          
          <Form.Item
            name="provider_type"
            label="服务商类型标识"
            rules={[{ required: true, message: '请输入服务商类型标识!' }]}
          >
            <Input placeholder="例如: OpenAI (用于系统识别，建议使用英文)" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={2} placeholder="服务商的简要描述" />
          </Form.Item>
          
          <Form.Item
            name="auth_type"
            label="鉴权类型"
            rules={[{ required: true, message: '请选择鉴权类型!' }]}
          >
            <Select placeholder="选择鉴权类型">
              <Option value="api_key">API密钥</Option>
              <Option value="key_secret">密钥对</Option>
              <Option value="id_key_secret">ID和密钥对</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="required_fields"
            label="必填字段"
            tooltip="多个字段用逗号分隔，如: api_key, api_secret"
            rules={[{ required: true, message: '请输入必填字段!' }]}
          >
            <TextArea rows={2} placeholder="必填字段列表，用逗号分隔" />
          </Form.Item>
          
          <Form.Item
            name="optional_fields"
            label="可选字段"
            tooltip="多个字段用逗号分隔，如: api_base_url, region"
          >
            <TextArea rows={2} placeholder="可选字段列表，用逗号分隔" />
          </Form.Item>
          
          <Form.Item
            name="auth_description"
            label="鉴权描述"
          >
            <TextArea rows={3} placeholder="为用户提供获取鉴权信息的指引" />
          </Form.Item>
          
          <Form.Item
            name="is_active"
            label="启用状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LlmProviderManagePage;