import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Result, Spin } from 'antd';
import VocBotChat from './components/VocBotChat';

const VocBotPage = () => {
  const { app_key } = useParams();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simple validation - in a real app you might want to verify the app_key
    if (app_key && app_key.length > 0) {
      // You could make a validation request here if needed
      setIsValid(true);
      setIsValidating(false);
    } else {
      setError('Invalid application key');
      setIsValid(false);
      setIsValidating(false);
    }
  }, [app_key]);

  if (isValidating) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Validating application..." />
      </div>
    );
  }

  if (!isValid) {
    return (
      <Result
        status="error"
        title="Application Error"
        subTitle={error || 'Invalid or missing application key.'}
      />
    );
  }

  return <VocBotChat />;
};

export default VocBotPage;