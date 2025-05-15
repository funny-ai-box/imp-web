// File: src/pages/FoundationModelsPage.jsx
import React, { useState, useEffect } from 'react';
import { List, Card, Typography, Spin, message, Button, Modal, Descriptions } from 'antd';
import { getLlmProviderList, getLlmProviderDetail, getLlmModelList } from '../api'; // Ensure this path is correct

const { Title, Text } = Typography;

const FoundationModelsPage = () => {
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerDetails, setProviderDetails] = useState(null);
  const [models, setModels] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const response = await getLlmProviderList();
        // API doc says {}, this will likely be empty or need specific handling
        // Assuming a potential structure like response.data.data.items or response.data
        const providerData = response.data?.data?.items || response.data?.data || response.data || [];
        setProviders(providerData);

        if ((!response.data || Object.keys(response.data).length === 0 || providerData.length === 0) && response.status === 200) {
          message.info('LLM Provider list API returned no data or an empty success response.');
        }
      } catch (error) {
        message.error('Failed to fetch LLM providers.');
        console.error("Error fetching LLM providers:", error);
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, []);

  const handleViewProviderDetails = async (provider) => {
    // Assuming provider object has an 'id' or 'provider_id' and 'name'
    const providerId = provider.id || provider.provider_id;
    const providerName = provider.name || `Provider ${providerId}`;

    if (!providerId) {
      message.error("Provider ID is missing, cannot fetch details.");
      return;
    }

    setSelectedProvider({ ...provider, id: providerId, name: providerName }); // Normalize selectedProvider
    setIsDetailModalVisible(true);
    setLoadingDetails(true);
    setLoadingModels(true);
    setProviderDetails(null);
    setModels([]);

    try {
      const detailRes = await getLlmProviderDetail(providerId);
      // API doc says {}, handle accordingly
      setProviderDetails(detailRes.data?.data || detailRes.data || { info: `Details API returned empty for ${providerName}.` });
    } catch (error) {
      message.error(`Failed to fetch details for ${providerName}.`);
      setProviderDetails({ error: `Failed to load details for ${providerName}.` });
      console.error(`Error fetching details for ${providerName}:`, error);
    } finally {
      setLoadingDetails(false);
    }

    try {
      const modelsRes = await getLlmModelList(providerId);
      // API doc says {}, handle accordingly
      const modelData = modelsRes.data?.data?.items || modelsRes.data?.data || modelsRes.data || [];
      setModels(modelData);
      if ((!modelsRes.data || Object.keys(modelsRes.data).length === 0 || modelData.length === 0) && modelsRes.status === 200) {
        message.info(`LLM Model list API returned no data for ${providerName}.`);
      }
    } catch (error) {
      message.error(`Failed to fetch models for ${providerName}.`);
      console.error(`Error fetching models for ${providerName}:`, error);
    } finally {
      setLoadingModels(false);
    }
  };

  return (
    <div>
      <Title level={2}>Foundation Model Providers</Title>
      {loadingProviders ? <Spin /> : (
        providers.length > 0 ? (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
            dataSource={providers}
            renderItem={(provider) => (
              <List.Item>
                {/* Ensure provider has a unique key, e.g., provider.id */}
                <Card title={provider.name || `Provider ID: ${provider.id || provider.provider_id || 'N/A'}`}>
                  <Text>ID: {provider.id || provider.provider_id || 'N/A'}</Text>
                  {/* Add more summary details if available in the provider list item */}
                  <br />
                  <Button type="link" onClick={() => handleViewProviderDetails(provider)} style={{ marginTop: '10px' }}>
                    View Details & Models
                  </Button>
                </Card>
              </List.Item>
            )}
            rowKey={(provider) => provider.id || provider.provider_id || Math.random()} // Provide a stable key
          />
        ) : (
          <Text>No LLM providers found. The API might have returned an empty list or an empty object as per documentation.</Text>
        )
      )}

      {selectedProvider && (
        <Modal
          title={`Details for ${selectedProvider.name}`}
          open={isDetailModalVisible} // 'open' prop for AntD v5 Modal
          onCancel={() => setIsDetailModalVisible(false)}
          footer={null}
          width={600}
        >
          <Title level={5}>Provider Information</Title>
          {loadingDetails ? <Spin tip="Loading details..." /> : providerDetails ? (
            <Descriptions bordered column={1} size="small">
              {Object.entries(providerDetails).map(([key, value]) => (
                <Descriptions.Item label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} key={key}>
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          ) : <Text>No details available.</Text>}

          <Title level={5} style={{ marginTop: 20 }}>Models</Title>
          {loadingModels ? <Spin tip="Loading models..." /> : models.length > 0 ? (
            <List
              size="small"
              bordered
              dataSource={models}
              renderItem={model => (
                // Ensure model has a unique key, e.g., model.id
                <List.Item>
                  <Text strong>{model.name || model.id || 'Unnamed Model'}</Text> (ID: {model.id || 'N/A'})
                  {/* Render other model properties if available */}
                </List.Item>
              )}
              rowKey={(model) => model.id || Math.random()} // Provide a stable key
            />
          ) : <Text>No models listed for this provider, or the API returned an empty response.</Text>}
        </Modal>
      )}
    </div>
  );
};

export default FoundationModelsPage;