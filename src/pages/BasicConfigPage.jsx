import React, { useState } from 'react';
import { Tabs } from 'antd';
import LlmConfigPage from '../components/BasicConfig/LlmConfigPage';
import LlmProviderManagePage from '../components/BasicConfig/LlmProviderManagePage';

const { TabPane } = Tabs;

const BasicConfigPage = () => {
  const [activeKey, setActiveKey] = useState('1');

  const handleTabChange = (key) => {
    setActiveKey(key);
  };

  return (
    <Tabs activeKey={activeKey} onChange={handleTabChange}>
      <TabPane tab="大模型配置" key="1">
        <LlmConfigPage />
      </TabPane>
      <TabPane tab="服务商管理" key="2">
        <LlmProviderManagePage />
      </TabPane>
    </Tabs>
  );
};

export default BasicConfigPage;