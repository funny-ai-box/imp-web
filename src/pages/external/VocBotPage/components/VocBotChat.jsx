import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Typography, Spin, Space, Avatar, Carousel } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, FileTextOutlined } from '@ant-design/icons';
import { volcanoBot } from '../../../../api/externalApi';
import './VocBotChat.css';

const { Text, Title, Paragraph } = Typography;

// Message component to display individual messages
const ChatMessage = ({ message, isUser }) => (
  <div className={`chat-message ${isUser ? 'user-message' : 'bot-message'}`}>
    <div className="message-avatar">
      <Avatar 
        icon={isUser ? <UserOutlined /> : <RobotOutlined />} 
        className={isUser ? 'user-avatar' : 'bot-avatar'} 
      />
    </div>
    <div className="message-content">
      <Paragraph className="message-text">{message}</Paragraph>
    </div>
  </div>
);

// References component to display document references as a carousel
const References = ({ references }) => {
  if (!references || references.length === 0) return null;

  return (
    <div className="references-container">
      <Title level={5}>参考文档</Title>
      <Carousel 
        dots={true}
        slidesToShow={1}
        swipe={true}
        className="references-carousel"
      >
        {references.map((ref, index) => (
          <div key={index}>
            <Card className="reference-card">
              <div className="reference-header">
                <FileTextOutlined className="reference-icon" />
                <Text strong className="reference-title">{ref.doc_title || ref.doc_name}</Text>
              </div>
              {ref.chunk_title && (
                <div className="reference-content">
                  <Paragraph ellipsis={{ rows: 3 }}>{ref.chunk_title}</Paragraph>
                </div>
              )}
              <div className="reference-footer">
                <Text type="secondary">文档ID: {ref.doc_id}</Text>
                {ref.chunk_id && <Text type="secondary">片段ID: {ref.chunk_id}</Text>}
              </div>
            </Card>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

const VocBotChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [references, setReferences] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setCurrentResponse('');
    setIsStreaming(true);
    setReferences([]);

    try {
      await volcanoBot.generateStream(
        userMessage,
        // Handle incoming message chunks
        (data) => {
          setCurrentResponse(prev => prev + (data.text || ''));
        },
        // Handle references
        (data) => {
          setReferences(data);
        },
        // Handle errors
        (error) => {
          console.error('Stream error:', error);
          setMessages(prev => [...prev, { 
            text: '抱歉，请求处理过程中出现了错误。请稍后再试。', 
            isUser: false 
          }]);
          setIsStreaming(false);
          setIsLoading(false);
        },
        // Handle stream completion
        () => {
          setIsStreaming(false);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        text: '抱歉，发送消息时出现了错误。请稍后再试。', 
        isUser: false 
      }]);
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  // When the streaming response is updated or finished
  useEffect(() => {
    if (currentResponse && !isStreaming) {
      // Stream is complete, add the full message
      setMessages(prev => [...prev, { text: currentResponse, isUser: false }]);
      setCurrentResponse('');
    }
  }, [currentResponse, isStreaming]);

  return (
    <div className="voc-bot-container">
      <div className="chat-header">
        <Title level={3}>Volcano Assistant</Title>
        <Text type="secondary">Ask me anything about your documents</Text>
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <ChatMessage 
            key={index} 
            message={message.text} 
            isUser={message.isUser} 
          />
        ))}
        
        {currentResponse && (
          <ChatMessage 
            message={currentResponse} 
            isUser={false} 
          />
        )}
        
        {isLoading && !currentResponse && (
          <div className="loading-indicator">
            <Spin size="small" />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {references.length > 0 && <References references={references} />}
      
      <div className="chat-input-container">
        <Input.TextArea
          className="chat-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="输入您的问题..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={isLoading}
        />
        <Button 
          type="primary" 
          icon={<SendOutlined />} 
          onClick={handleSendMessage}
          loading={isLoading}
          className="send-button"
        />
      </div>
    </div>
  );
};

export default VocBotChat;