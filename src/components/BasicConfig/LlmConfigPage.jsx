import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  message, 
  Tabs, 
  Modal, 
  Form, 
  Input, 
  Select,
  Switch,
  Tooltip,
  Tag,
  Typography,
  Drawer,
  Descriptions,
  List
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  StarOutlined, 
  StarFilled,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { 
  getLlmProviderList, 
  getLlmProviderDetail, 
  getLlmModelList,
  createLlmProviderConfig,
  updateLlmProviderConfig,
  deleteLlmProviderConfig,
  setDefaultLlmProviderConfig,
  getLlmProviderConfigList
} from '../../api';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const LlmConfigPage = () => {
  // 状态管理
  const [providers, setProviders] = useState([]);
  const [userConfigs, setUserConfigs] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [configFormVisible, setConfigFormVisible] = useState(false);
  const [providerDrawerVisible, setProviderDrawerVisible] = useState(false);
  const [modelsDrawerVisible, setModelsDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const [configForm] = Form.useForm();
  const [configMode, setConfigMode] = useState('create'); // 'create' 或 'edit'
  const [passwordVisible, setPasswordVisible] = useState(false);

  // 初始加载服务商列表
  useEffect(() => {
    fetchProviders();
    if (activeTab === '2') {
      fetchUserConfigs();
    }
  }, [activeTab]);

  // 获取服务商列表
  const fetchProviders = async () => {
    setLoading(true);
    try {
      const response = await getLlmProviderList();
      if (response.data?.code === 200) {
        setProviders(response.data?.data || []);
      } else {
        message.error('获取服务商列表失败');
      }
    } catch (error) {
      message.error('获取服务商列表失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 获取用户配置列表
  const fetchUserConfigs = async () => {
    setLoading(true);
    try {
      const response = await getLlmProviderConfigList();
      if (response.data?.code === 200) {
        setUserConfigs(response.data?.data || []);
      } else {
        message.error('获取配置列表失败');
      }
    } catch (error) {
      message.error('获取配置列表失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 查看服务商详情
  const handleViewProvider = async (provider) => {
    setLoading(true);
    try {
      const response = await getLlmProviderDetail(provider.id);
      if (response.data?.code === 200) {
        setSelectedProvider({ ...provider, ...response.data?.data });
        setProviderDrawerVisible(true);
      } else {
        message.error('获取服务商详情失败');
      }
    } catch (error) {
      message.error('获取服务商详情失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 查看服务商模型列表
  const handleViewModels = async (provider) => {
    setLoading(true);
    try {
      const response = await getLlmModelList(provider.id);
      if (response.data?.code === 200) {
        setModels(response.data?.data || []);
        setSelectedProvider(provider);
        setModelsDrawerVisible(true);
      } else {
        message.error('获取模型列表失败');
      }
    } catch (error) {
      message.error('获取模型列表失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 打开配置表单
  const handleAddConfig = (provider) => {
    setConfigMode('create');
    setSelectedProvider(provider);
    configForm.resetFields();
    configForm.setFieldsValue({
      provider_type: provider.provider_type,
      name: `${provider.name}配置`,
      is_active: true,
      request_timeout: 60,
      max_retries: 3
    });
    setConfigFormVisible(true);
  };

  // 编辑配置
  const handleEditConfig = (config) => {
    setConfigMode('edit');
    setSelectedConfig(config);
    configForm.resetFields();
    configForm.setFieldsValue({
      ...config,
      // 安全原因不回显密钥信息，或者用*号代替
      api_key: config.api_key ? '********' : '',
      api_secret: config.api_secret ? '********' : '',
      app_secret: config.app_secret ? '********' : '',
    });
    setConfigFormVisible(true);
  };

  // 删除配置
  const handleDeleteConfig = async (config) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除配置 "${config.name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await deleteLlmProviderConfig(config.id);
          if (response.data?.code === 200) {
            message.success('删除配置成功');
            fetchUserConfigs();
          } else {
            message.error('删除配置失败');
          }
        } catch (error) {
          message.error('删除配置失败: ' + (error.response?.data?.message || error.message));
        }
      }
    });
  };

  // 设置默认配置
  const handleSetDefaultConfig = async (config) => {
    try {
      const response = await setDefaultLlmProviderConfig(config.id);
      if (response.data?.code === 200) {
        message.success(`已将 "${config.name}" 设为默认配置`);
        fetchUserConfigs();
      } else {
        message.error('设置默认配置失败');
      }
    } catch (error) {
      message.error('设置默认配置失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 提交配置表单
  const handleSubmitConfig = async () => {
    try {
      const values = await configForm.validateFields();
      
      // 移除密钥字段中的占位符
      if (values.api_key === '********') delete values.api_key;
      if (values.api_secret === '********') delete values.api_secret;
      if (values.app_secret === '********') delete values.app_secret;
      
      if (configMode === 'create') {
        const response = await createLlmProviderConfig(values);
        if (response.data?.code === 200) {
          message.success('创建配置成功');
          setConfigFormVisible(false);
          if (activeTab === '2') fetchUserConfigs();
        } else {
          message.error('创建配置失败');
        }
      } else {
        const response = await updateLlmProviderConfig({
          ...values,
          config_id: selectedConfig.id
        });
        if (response.data?.code === 200) {
          message.success('更新配置成功');
          setConfigFormVisible(false);
          fetchUserConfigs();
        } else {
          message.error('更新配置失败');
        }
      }
    } catch (error) {
      console.error('表单验证或提交失败:', error);
    }
  };

  // 服务商列表列定义
  const providerColumns = [
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
            icon={<EyeOutlined />} 
            onClick={() => handleViewProvider(record)}
            size="small"
          >
            详情
          </Button>
          <Button 
            type="link" 
            icon={<ApiOutlined />} 
            onClick={() => handleViewModels(record)}
            size="small"
          >
            模型
          </Button>
          <Button 
            type="primary" 
            icon={<SettingOutlined />} 
            onClick={() => handleAddConfig(record)}
            size="small"
          >
            配置
          </Button>
        </Space>
      ),
    },
  ];

  // 用户配置列表列定义
  const configColumns = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '服务商类型',
      dataIndex: 'provider_type',
      key: 'provider_type',
    },
    {
      title: '默认配置',
      dataIndex: 'is_default',
      key: 'is_default',
      render: (isDefault) => (
        isDefault ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />
      )
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
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {!record.is_default && (
            <Button 
              type="link" 
              icon={<StarOutlined />} 
              onClick={() => handleSetDefaultConfig(record)}
              size="small"
            >
              设为默认
            </Button>
          )}
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEditConfig(record)}
            size="small"
          >
            编辑
          </Button>
          <Button 
            type="link" 
            icon={<DeleteOutlined />} 
            danger
            onClick={() => handleDeleteConfig(record)}
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>大模型配置</Title>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="模型服务商" key="1">
          <Table 
            columns={providerColumns} 
            dataSource={providers} 
            rowKey="id" 
            loading={loading}
          />
        </TabPane>
        <TabPane tab="我的配置" key="2">
          <Table 
            columns={configColumns} 
            dataSource={userConfigs} 
            rowKey="id" 
            loading={loading}
          />
        </TabPane>
      </Tabs>

      {/* 服务商详情抽屉 */}
      <Drawer
        title={`${selectedProvider?.name} 服务商详情`}
        width={520}
        placement="right"
        onClose={() => setProviderDrawerVisible(false)}
        open={providerDrawerVisible}
      >
        {selectedProvider && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="服务商ID">{selectedProvider.id}</Descriptions.Item>
            <Descriptions.Item label="名称">{selectedProvider.name}</Descriptions.Item>
            <Descriptions.Item label="类型">{selectedProvider.provider_type}</Descriptions.Item>
            <Descriptions.Item label="描述">{selectedProvider.description || '无'}</Descriptions.Item>
            <Descriptions.Item label="鉴权类型">{selectedProvider.auth_type}</Descriptions.Item>
            <Descriptions.Item label="必填字段">
              <List
                size="small"
                dataSource={selectedProvider.required_fields || []}
                renderItem={item => <List.Item>{item}</List.Item>}
              />
            </Descriptions.Item>
            {selectedProvider.optional_fields && selectedProvider.optional_fields.length > 0 && (
              <Descriptions.Item label="可选字段">
                <List
                  size="small"
                  dataSource={selectedProvider.optional_fields}
                  renderItem={item => <List.Item>{item}</List.Item>}
                />
              </Descriptions.Item>
            )}
            <Descriptions.Item label="鉴权说明">{selectedProvider.auth_description || '无'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selectedProvider.is_active ? 'green' : 'red'}>
                {selectedProvider.is_active ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* 模型列表抽屉 */}
      <Drawer
        title={`${selectedProvider?.name} 支持的模型`}
        width={600}
        placement="right"
        onClose={() => setModelsDrawerVisible(false)}
        open={modelsDrawerVisible}
      >
        <Table
          dataSource={models}
          rowKey="id"
          columns={[
            { title: '模型名称', dataIndex: 'name', key: 'name' },
            { title: '模型ID', dataIndex: 'model_id', key: 'model_id' },
            { title: '模型类型', dataIndex: 'model_type', key: 'model_type' },
            { 
              title: '状态', 
              dataIndex: 'is_available', 
              key: 'is_available',
              render: (available) => (
                <Tag color={available ? 'green' : 'red'}>
                  {available ? '可用' : '不可用'}
                </Tag>
              )
            },
          ]}
          expandable={{
            expandedRowRender: (record) => (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="描述">{record.description || '无'}</Descriptions.Item>
                <Descriptions.Item label="能力">{record.capabilities || '无'}</Descriptions.Item>
                <Descriptions.Item label="上下文窗口">{record.context_window || '未指定'}</Descriptions.Item>
                <Descriptions.Item label="最大令牌数">{record.max_tokens || '未指定'}</Descriptions.Item>
                <Descriptions.Item label="输入价格">{record.token_price_input ? `${record.token_price_input}/1k tokens` : '未指定'}</Descriptions.Item>
                <Descriptions.Item label="输出价格">{record.token_price_output ? `${record.token_price_output}/1k tokens` : '未指定'}</Descriptions.Item>
              </Descriptions>
            ),
          }}
        />
      </Drawer>

      {/* 配置表单模态框 */}
      <Modal
        title={configMode === 'create' ? '添加大模型配置' : '编辑大模型配置'}
        open={configFormVisible}
        onCancel={() => setConfigFormVisible(false)}
        onOk={handleSubmitConfig}
        width={600}
        okText={configMode === 'create' ? '创建' : '更新'}
        cancelText="取消"
      >
        <Form form={configForm} layout="vertical">
          <Form.Item
            name="name"
            label="配置名称"
            rules={[{ required: true, message: '请输入配置名称!' }]}
          >
            <Input placeholder="例如: OpenAI生产环境" />
          </Form.Item>
          
          <Form.Item
            name="provider_type"
            label="服务商类型"
            rules={[{ required: true, message: '请选择服务商类型!' }]}
          >
            <Input disabled={configMode === 'edit'} />
          </Form.Item>
          
          <Form.Item
            name="api_key"
            label="API密钥"
          >
            <Input.Password 
              placeholder="请输入API密钥" 
              iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
          
          <Form.Item
            name="api_secret"
            label="API密钥密文"
          >
            <Input.Password 
              placeholder="请输入API密钥密文" 
              iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
          
          <Form.Item
            name="app_id"
            label="应用ID"
          >
            <Input placeholder="请输入应用ID" />
          </Form.Item>
          
          <Form.Item
            name="app_key"
            label="应用Key"
          >
            <Input placeholder="请输入应用Key" />
          </Form.Item>
          
          <Form.Item
            name="app_secret"
            label="应用密钥"
          >
            <Input.Password 
              placeholder="请输入应用密钥" 
              iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
          
          <Form.Item
            name="api_base_url"
            label="API基础URL"
          >
            <Input placeholder="例如: https://api.openai.com" />
          </Form.Item>
          
          <Form.Item
            name="api_version"
            label="API版本"
          >
            <Input placeholder="例如: v1" />
          </Form.Item>
          
          <Form.Item
            name="region"
            label="区域设置"
          >
            <Select placeholder="选择区域">
              <Option value="cn">中国</Option>
              <Option value="us">美国</Option>
              <Option value="eu">欧洲</Option>
              <Option value="ap">亚太</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="request_timeout"
            label="请求超时时间(秒)"
          >
            <Input type="number" min={1} />
          </Form.Item>
          
          <Form.Item
            name="max_retries"
            label="最大重试次数"
          >
            <Input type="number" min={0} />
          </Form.Item>
          
          <Form.Item
            name="is_active"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea rows={3} placeholder="可选描述信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LlmConfigPage;