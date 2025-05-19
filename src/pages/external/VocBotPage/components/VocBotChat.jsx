import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Typography, Spin, Space, Avatar, Carousel, Tooltip, Tag } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, FileTextOutlined } from '@ant-design/icons';
import { volcanoBot } from '../../../../api/externalApi';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';
import './VocBotChat.css';

const { Text } = Typography;

// Modified references component - with deduplication
const ReferencesCarousel = ({ references }) => {
  if (!references || references.length === 0) return null;

  // Deduplicate references based on doc_name
  const uniqueReferences = [];
  const docNameSet = new Set();
  
  references.forEach(ref => {
    const docName = ref.doc_name || ref.doc_title || 'Unknown';
    
    // Only add if doc_name hasn't been seen before
    if (!docNameSet.has(docName)) {
      docNameSet.add(docName);
      uniqueReferences.push(ref);
    }
  });

  return (
    <div className="references-container">
      <div className="references-header">
        <FileTextOutlined className="references-icon" />
        <Text className="references-title">参考文档 ({uniqueReferences.length})</Text>
      </div>
      
      <div className="references-list">
        {uniqueReferences.map((ref, index) => (
          <div key={index} className="reference-item">
            <FileTextOutlined className="reference-icon" />
            <Tooltip title={ref.doc_name || ref.doc_title || '文档'}>
              <Text className="reference-title" ellipsis={{ tooltip: true }}>
                {ref.doc_name || ref.doc_title || '文档'}
              </Text>
            </Tooltip>
            {ref.score && (
              <Tag color="green" className="reference-tag">
                {Math.round(ref.score * 100)}%
              </Tag>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Chat message component
const ChatMessage = ({ message, isUser, references, isTyping }) => (
  <div className={`chat-message ${isUser ? 'user-message' : 'bot-message'}`}>
    <div className="message-avatar">
      <Avatar 
        icon={isUser ? <UserOutlined /> : <RobotOutlined />} 
        className={isUser ? 'user-avatar' : 'bot-avatar'} 
      />
    </div>
    <div className="message-container">
      <div className="message-content">
        {isUser ? (
          <div className="message-text">{message}</div>
        ) : (
          <div className="message-text markdown-content">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeHighlight]} 
              components={{
                p: ({ node, ...props }) => <p className="md-paragraph" {...props} />,
                h1: ({ node, ...props }) => <h1 className="md-heading md-h1" {...props} />,
                h2: ({ node, ...props }) => <h2 className="md-heading md-h2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="md-heading md-h3" {...props} />,
                ul: ({ node, ...props }) => <ul className="md-list md-ul" {...props} />,
                ol: ({ node, ...props }) => <ol className="md-list md-ol" {...props} />,
                li: ({ node, ...props }) => <li className="md-list-item" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="md-blockquote" {...props} />,
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <div className="code-block-wrapper">
                      <div className="code-block-header">
                        <span className="code-language">{match ? match[1] : 'code'}</span>
                      </div>
                      <pre className="md-pre">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code className="md-inline-code" {...props}>
                      {children}
                    </code>
                  );
                },
                table: ({ node, ...props }) => <table className="md-table" {...props} />,
                th: ({ node, ...props }) => <th className="md-th" {...props} />,
                td: ({ node, ...props }) => <td className="md-td" {...props} />,
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        )}
        {isTyping && <div className="typing-indicator"><span></span><span></span><span></span></div>}
      </div>
      {!isUser && !isTyping && references && references.length > 0 && (
        <ReferencesCarousel references={references} />
      )}
    </div>
  </div>
);

// Main component
const VocBotChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentReferences, setCurrentReferences] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  // Adjust chat window height
  useEffect(() => {
    const adjustHeight = () => {
      if (chatContainerRef.current) {
        const windowHeight = window.innerHeight;
        const containerHeight = Math.min(windowHeight, 'calc(100vh - 300px)');
        chatContainerRef.current.style.height = `${containerHeight}px`;
      }
    };

    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, []);

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

  // Helper function to get previous messages history
  const getPreviousMessages = () => {
    // Get the last 3 messages without references
    const recentMessages = [...messages]
      .slice(-6) // Get last 6 messages as we need at most 3 complete exchanges
      .map(msg => ({ 
        text: msg.text, 
        isUser: msg.isUser 
      }))
      .slice(-3); // Take only 3 most recent messages
      
    return recentMessages;
  };

  // Send message with previous context
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setCurrentResponse('');
    setIsStreaming(true);
    setCurrentReferences([]);

    // Get previous messages for context
    const previousMessages = getPreviousMessages();

    try {
      await volcanoBot.generateStream(
        userMessage,
        // Stream handler
        (data) => {
          setCurrentResponse(prev => prev + (data.text || ''));
        },
        // References handler
        (data) => {
          // Store deduplicated references
          const uniqueRefs = [];
          const docNameSet = new Set();
          
          data.forEach(ref => {
            const docName = ref.doc_name || ref.doc_title || 'Unknown';
            if (!docNameSet.has(docName)) {
              docNameSet.add(docName);
              uniqueRefs.push(ref);
            }
          });
          
          setCurrentReferences(uniqueRefs);
        },
        // Error handler
        (error) => {
          console.error('Stream error:', error);
          setMessages(prev => [...prev, { 
            text: '抱歉，请求处理过程中出现了错误。请稍后再试。', 
            isUser: false 
          }]);
          setIsStreaming(false);
          setIsLoading(false);
        },
        // Completion handler
        () => {
          setIsStreaming(false);
          setIsLoading(false);
        },
        // Previous messages context - new parameter
        previousMessages
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
    
    // Focus input for continued typing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Update when streaming response completes
  useEffect(() => {
    if (currentResponse && !isStreaming) {
      // Add complete message with references
      setMessages(prev => [...prev, { 
        text: currentResponse, 
        isUser: false,
        references: currentReferences
      }]);
      setCurrentResponse('');
    }
  }, [currentResponse, isStreaming, currentReferences]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { 
          text: "你好！我是小红书KOS 智能助手，可以回答关于您的文档的任何问题。请输入您的问题，我会尽力帮助您。", 
          isUser: false 
        }
      ]);
    }
  }, [messages]);

  return (
    <div className="voc-bot-wrapper">
      <div className="voc-bot-container" ref={chatContainerRef}>
        <div className="chat-messages">
          {messages.map((message, index) => (
            <ChatMessage 
              key={index} 
              message={message.text} 
              isUser={message.isUser}
              references={message.references}
            />
          ))}
          
          {currentResponse && (
            <ChatMessage 
              message={currentResponse} 
              isUser={false} 
              isTyping={isStreaming}
            />
          )}
          
          {isLoading && !currentResponse && (
            <div className="loading-indicator">
              <Spin size="small" />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-footer">
          <div className="chat-input-container">
            <Input.TextArea
              className="chat-input"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="向 智能助手提问..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              disabled={isLoading}
              ref={inputRef}
            />
            <Tooltip title="发送">
              <Button 
                type="primary" 
                icon={<SendOutlined />} 
                onClick={handleSendMessage}
                loading={isLoading}
                className="send-button"
                disabled={!inputValue.trim() || isLoading}
              />
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocBotChat;