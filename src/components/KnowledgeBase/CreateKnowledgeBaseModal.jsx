import React from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, message } from 'antd';
import { createKnowledgeBase } from '../../api';

const { Option } = Select;

const CreateKnowledgeBaseModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        vector_store_config: values.vector_store_config ? JSON.parse(values.vector_store_config) : {},
      };
      await createKnowledgeBase(payload);
      message.success('Knowledge Base created successfully!');
      onSuccess();
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create Knowledge Base.');
      console.error('Create KB error:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      title="Create New Knowledge Base"
      okText="Create"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={handleCreate}
      width={600}
    >
      <Form form={form} layout="vertical" name="create_kb_form">
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input the name!' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="vector_store_type" label="Vector Store Type" initialValue="milvus">
          <Select>
            <Option value="milvus">Milvus</Option>
            {/* Add other types as needed */}
          </Select>
        </Form.Item>
        <Form.Item name="vector_store_config" label="Vector Store Config (JSON string)" initialValue="{}">
          <Input.TextArea rows={2} placeholder='e.g., {"uri": "localhost:19530"}' />
        </Form.Item>
        <Form.Item name="embedding_provider" label="Embedding Provider" initialValue="OpenAI">
          <Select>
            <Option value="OpenAI">OpenAI</Option>
            {/* Add other providers */}
          </Select>
        </Form.Item>
        <Form.Item name="embedding_model" label="Embedding Model" initialValue="text-embedding-3-small">
          <Input />
        </Form.Item>
        <Form.Item name="embedding_dimension" label="Embedding Dimension" initialValue={1536}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="chunk_size" label="Chunk Size" initialValue={1000}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="chunk_overlap" label="Chunk Overlap" initialValue={200}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="is_public" label="Is Public" valuePropName="checked" initialValue={false}>
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateKnowledgeBaseModal;