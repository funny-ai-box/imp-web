import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, message, Tooltip, Space, Divider, Collapse, Alert } from 'antd';
import { QuestionCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { createKnowledgeBase } from '../../api';

const { Option } = Select;
const { Panel } = Collapse;

const CreateKnowledgeBaseModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // 尝试解析向量存储配置，提供更友好的错误处理
      let vectorStoreConfig = {};
      try {
        vectorStoreConfig = values.vector_store_config ? JSON.parse(values.vector_store_config) : {};
      } catch (error) {
        message.error('向量存储配置JSON格式不正确，请检查');
        setLoading(false);
        return;
      }
      
      const payload = {
        ...values,
        vector_store_config: vectorStoreConfig,
      };
      
      await createKnowledgeBase(payload);
      message.success('知识库创建成功！');
      onSuccess();
      form.resetFields();
    } catch (error) {
      if (error.response?.data?.message) {
        message.error(`创建知识库失败：${error.response.data.message}`);
      } else if (error.message) {
        message.error(`创建知识库失败：${error.message}`);
      } else {
        message.error('创建知识库失败，请重试');
      }
      console.error('创建知识库错误:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title="创建新知识库"
      okText="创建"
      cancelText="取消"
      onCancel={onCancel}
      onOk={handleCreate}
      width={700}
      confirmLoading={loading}
    >
      <Alert 
        message="创建知识库后，您可以上传文档并进行向量化处理" 
        description="知识库是存储和查询文档内容的基础，创建后可以添加文档、切分文本、生成向量并进行语义查询。" 
        type="info" 
        showIcon 
        style={{ marginBottom: 16 }}
      />
      
      <Form form={form} layout="vertical" name="create_kb_form">
        <Form.Item 
          name="name" 
          label="知识库名称" 
          rules={[{ required: true, message: '请输入知识库名称！' }]}
          tooltip="给您的知识库起一个直观的名称，便于识别"
        >
          <Input placeholder="例如：产品文档库、技术规范库" />
        </Form.Item>
        
        <Form.Item 
          name="description" 
          label="描述"
          tooltip="对知识库用途和内容的简要说明"
        >
          <Input.TextArea rows={2} placeholder="描述这个知识库的用途、包含的内容类型等" />
        </Form.Item>
        
        <Divider orientation="left">存储配置</Divider>
        
        <Form.Item 
          name="vector_store_type" 
          label="向量存储类型" 
          initialValue="milvus"
          tooltip="选择向量数据的存储方式"
        >
          <Select>
            <Option value="milvus">Milvus</Option>
            <Option value="faiss">FAISS</Option>
            <Option value="chroma">Chroma</Option>
            <Option value="weaviate">Weaviate</Option>
            <Option value="pinecone">Pinecone</Option>
          </Select>
        </Form.Item>
        
        <Form.Item 
          name="vector_store_config" 
          label={
            <Space>
              <span>向量存储配置</span>
              <Tooltip title="输入JSON格式的配置，根据不同存储类型所需的参数不同">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          } 
          initialValue="{}"
        >
          <Input.TextArea 
            rows={3} 
            placeholder='例如 Milvus：{"uri": "localhost:19530"}' 
          />
        </Form.Item>
        
        <Collapse ghost>
        
        </Collapse>
        
        <Divider orientation="left">嵌入配置</Divider>
        
        <Form.Item 
          name="embedding_provider" 
          label="嵌入提供商" 
          initialValue="OpenAI"
          tooltip="提供词嵌入服务的模型提供商"
        >
          <Select>
            <Option value="OpenAI">OpenAI</Option>
            <Option value="HuggingFace">HuggingFace</Option>
            <Option value="Cohere">Cohere</Option>
            <Option value="Local">本地模型</Option>
          </Select>
        </Form.Item>
        
        <Form.Item 
          name="embedding_model" 
          label="嵌入模型" 
          initialValue="text-embedding-3-small"
          tooltip="用于生成文本向量表示的具体模型"
        >
          <Input placeholder="例如：text-embedding-3-small, text-embedding-3-large" />
        </Form.Item>
        
        <Form.Item 
          name="embedding_dimension" 
          label="嵌入维度" 
          initialValue={1536}
          tooltip="向量的维度大小，由所选模型决定"
        >
          <InputNumber style={{ width: '100%' }} min={1} />
        </Form.Item>
        
        <Divider orientation="left">文本处理配置</Divider>
        
        <Form.Item 
          name="chunk_size" 
          label={
            <Space>
              <span>分块大小</span>
              <Tooltip title="每个文本块的最大标记（token）数量，较大的值适合保留上下文，但可能降低检索精度">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          }
          initialValue={1000}
        >
          <InputNumber style={{ width: '100%' }} min={100} />
        </Form.Item>
        
        <Form.Item 
          name="chunk_overlap" 
          label={
            <Space>
              <span>分块重叠</span>
              <Tooltip title="相邻块之间重叠的标记数量，有助于保持上下文连贯性">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          } 
          initialValue={200}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        
        <Divider orientation="left">访问控制</Divider>
        
        <Form.Item 
          name="is_public" 
          label="公开访问" 
          valuePropName="checked" 
          initialValue={false}
          tooltip="启用后，无需登录即可查询此知识库"
        >
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateKnowledgeBaseModal;