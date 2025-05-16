import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Spin, Typography, Checkbox, InputNumber, Select, message, List, Tag, Collapse, Space, Divider, Tooltip, Avatar, Empty } from 'antd';
import { SendOutlined, SettingOutlined, InfoCircleOutlined, FileSearchOutlined, RobotOutlined, HistoryOutlined } from '@ant-design/icons';
import { queryKnowledgeBase, queryPublicKnowledgeBase, getLlmProviderConfigList } from '../../../api';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

const QueryKnowledgeBasePage = ({ kbId, kbName, isPublicQuery = false }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [advancedVisible, setAdvancedVisible] = useState(false);
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // 获取LLM配置列表
  useEffect(() => {
    const fetchLlmConfigs = async () => {
      if (!isPublicQuery) { // 只在非公共查询模式下加载
        setLoadingConfigs(true);
        try {
          const response = await getLlmProviderConfigList();
          if (response.data?.code === 200) {
            setLlmConfigs(response.data.data || []);
          }
        } catch (error) {
          console.error('获取LLM配置失败:', error);
        } finally {
          setLoadingConfigs(false);
        }
      }
    };
    
    fetchLlmConfigs();
  }, [isPublicQuery]);

  const onFinish = async (values) => {
    setLoading(true);
    setResult(null);
    try {
      // 尝试解析过滤条件
      let filter = {};
      try {
        filter = values.filter ? JSON.parse(values.filter) : {};
      } catch (error) {
        message.error('元数据过滤条件JSON格式不正确');
        setLoading(false);
        return;
      }

      const payload = {
        kb_id: kbId,
        query: values.query,
        top_k: values.top_k,
        filter: filter,
        provider_type: values.provider_type,
        model: values.model,
        include_sources: values.include_sources,
      };
      
      // 添加到聊天历史 - 用户问题
      setChatHistory(prev => [...prev, { 
        role: 'user', 
        content: values.query,
        time: new Date().toISOString() 
      }]);
      
      const response = isPublicQuery 
        ? await queryPublicKnowledgeBase(payload) 
        : await queryKnowledgeBase(payload);
      
      const responseData = response.data?.data;
      
      if (responseData) {
        setResult(responseData);
        
        // 添加到聊天历史 - 系统回复
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: responseData.response,
          sources: responseData.sources,
          time: new Date().toISOString()
        }]);
      } else {
        message.info('未从API收到响应或格式异常');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '查询知识库失败');
      console.error('查询错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChatHistory = () => {
    if (chatHistory.length === 0) return null;
    
    return (
      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <Divider orientation="left">
          <Space>
            <HistoryOutlined />
            <span>对话历史</span>
          </Space>
        </Divider>
        
        <List
          itemLayout="horizontal"
          dataSource={chatHistory}
          renderItem={item => (
            <List.Item style={{ padding: '12px 0' }}>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={item.role === 'user' ? null : <RobotOutlined />} 
                    style={{ 
                      backgroundColor: item.role === 'user' ? '#1890ff' : '#52c41a',
                    }}
                  >
                    {item.role === 'user' ? '用' : '答'}
                  </Avatar>
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>{item.role === 'user' ? '您的提问' : '知识库回答'}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(item.time).toLocaleString('zh-CN')}
                    </Text>
                  </div>
                }
                description={
                  <div>
                    <Paragraph style={{ marginBottom: 8 }}>{item.content}</Paragraph>
                    {item.sources && item.sources.length > 0 && (
                      <div>
                        <Text type="secondary">引用来源：</Text>
                        {item.sources.map((source, idx) => (
                          <Tag color="blue" key={idx}>文档ID: {source.document_id}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    );
  };

  return (
    <Card 
      title={
        <Space>
          <FileSearchOutlined />
          {isPublicQuery ? `查询公共知识库: ${kbName || kbId}` : `查询知识库: ${kbName || kbId}`}
        </Space>
      }
      extra={
        <Button 
          type="text" 
          icon={<SettingOutlined />} 
          onClick={() => setAdvancedVisible(!advancedVisible)}
        >
          高级设置
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          top_k: 5,
          provider_type: 'OpenAI',
          model: 'gpt-4',
          include_sources: true,
          filter: '{}',
        }}
      >
        <Form.Item 
          name="query" 
          rules={[{ required: true, message: '请输入您的问题' }]}
        >
          <TextArea 
            rows={3} 
            placeholder="请输入您想问的问题..." 
            allowClear
            showCount
            maxLength={500}
          />
        </Form.Item>
        
        <Form.Item style={{ marginBottom: 0 }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SendOutlined />}
            size="large"
            block
          >
            发送问题
          </Button>
        </Form.Item>
        
        <Collapse 
          ghost 
          activeKey={advancedVisible ? '1' : undefined}
          style={{ marginTop: 16 }}
        >
          <Panel header="高级查询设置" key="1">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="top_k" 
                  label={
                    <Space>
                      <span>检索块数量</span>
                      <Tooltip title="检索的文本块数量，数值越大结果越全面但可能降低精确度">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                  rules={[{ required: true, message: '请设置检索块数量' }]}
                >
                  <InputNumber min={1} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="filter" 
                  label={
                    <Space>
                      <span>元数据过滤</span>
                      <Tooltip title="JSON格式的过滤条件，用于筛选特定元数据的文本块">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                >
                  <Input placeholder='例如：{"tag": "重要"}' />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="provider_type" 
                  label="LLM提供商类型" 
                  rules={[{ required: true, message: '请选择LLM提供商' }]}
                >
                  {loadingConfigs ? (
                    <Select loading placeholder="加载中..." />
                  ) : (
                    <Select placeholder="选择LLM提供商">
                      {llmConfigs.map(config => (
                        <Option key={config.provider_type} value={config.provider_type}>
                          {config.name}
                        </Option>
                      ))}
                      {llmConfigs.length === 0 && (
                        <>
                          <Option value="OpenAI">OpenAI</Option>
                          <Option value="Anthropic">Anthropic</Option>
                        </>
                      )}
                    </Select>
                  )}
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="model" 
                  label="LLM模型名称" 
                  rules={[{ required: true, message: '请输入模型名称' }]}
                >
                  <Select placeholder="选择模型">
                    <Option value="gpt-4">GPT-4</Option>
                    <Option value="gpt-4-turbo">GPT-4 Turbo</Option>
                    <Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Option>
                    <Option value="claude-3-opus">Claude 3 Opus</Option>
                    <Option value="claude-3-sonnet">Claude 3 Sonnet</Option>
                    <Option value="claude-3-haiku">Claude 3 Haiku</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item 
              name="include_sources" 
              valuePropName="checked"
              tooltip="启用后，回答将包含引用来源信息"
            >
              <Checkbox>包含引用来源</Checkbox>
            </Form.Item>
          </Panel>
        </Collapse>
      </Form>

      {renderChatHistory()}

      {loading && <Spin tip="正在查询知识库..." style={{ display: 'block', marginTop: 20 }} />}

      {result && (
        <div style={{ marginTop: 20 }}>
          <Divider orientation="left">
            <Space>
              <RobotOutlined />
              <span>查询结果</span>
            </Space>
          </Divider>
          
          <Card>
            <Paragraph style={{ whiteSpace: 'pre-wrap', background: '#f0f2f5', padding: '16px', borderRadius: '8px' }}>
              {result.response || '未提供文本回答。'}
            </Paragraph>
            
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Statistic title="问题" value={result.query} valueStyle={{ fontSize: '14px' }} />
              </Col>
              <Col span={8}>
                <Statistic title="令牌用量" value={result.tokens_used || '未知'} />
              </Col>
              <Col span={8}>
                <Statistic title="响应时间" value={result.duration_ms ? `${result.duration_ms} 毫秒` : '未知'} />
              </Col>
            </Row>

            {result.sources && result.sources.length > 0 && (
              <>
                <Divider orientation="left">引用来源 ({result.sources.length})</Divider>
                <List
                  size="small"
                  bordered
                  dataSource={result.sources}
                  renderItem={(item) => (
                    <List.Item>
                      <Space>
                        <Text strong>文档ID:</Text> 
                        <Text copyable>{item.document_id}</Text>
                        <Tag color="blue">相关度: {item.score ? item.score.toFixed(4) : '未知'}</Tag>
                        {item.id && <Text type="secondary">块ID: {item.id}</Text>}
                      </Space>
                    </List.Item>
                  )}
                />
              </>
            )}
            
            {result.retrieved_chunks && result.retrieved_chunks.length > 0 && (
              <Collapse style={{marginTop: '20px'}}>
                <Panel 
                  header={`检索到的文本块详情 (${result.retrieved_chunks.length})`} 
                  key="1"
                  extra={<Tag color="purple">总块数: {result.total_chunks || 0}</Tag>}
                >
                  <List
                    itemLayout="vertical"
                    dataSource={result.retrieved_chunks}
                    renderItem={chunk => (
                      <List.Item key={chunk.id}>
                        <List.Item.Meta
                          title={
                            <Space>
                              <Text strong>块ID: {chunk.id}</Text>
                              <Text type="secondary">(文档ID: {chunk.document_id})</Text>
                              <Tag color="blue">相关度: {chunk.score ? chunk.score.toFixed(4) : '未知'}</Tag>
                            </Space>
                          }
                          description={
                            <>
                              <Paragraph>
                                <Text strong>索引位置:</Text> {chunk.chunk_index}, 
                                <Text strong> 令牌数:</Text> {chunk.token_count}
                              </Paragraph>
                              <Card size="small" style={{ marginTop: 8 }}>
                                <Paragraph 
                                  ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Text strong>内容预览: </Text>{chunk.content_preview || chunk.content}
                                </Paragraph>
                              </Card>
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Panel>
              </Collapse>
            )}
          </Card>
        </div>
      )}
    </Card>
  );
};

export default QueryKnowledgeBasePage;
