import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { Typography, Row, Col, List, Avatar, Input, Tabs, Spin } from 'antd';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { Conversation as ConversationType, Message, Property } from '../types';
import { useLocation } from 'react-router-dom';
import { createOrGetConversation, getMessages } from '../services/chat.service';
import { getPropertiesByAgent } from '../services/property.service';

const { Title } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

const ChatsPage: React.FC = () => {
  const { conversations, selectedConversation, selectConversation, messages, sendMessage, socket } = useContext(ChatContext);
  const authContext = useContext(AuthContext);
  const [messageContent, setMessageContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [agentProperty, setAgentProperty] = useState<Property | null>(null);

  // Получаем companion всегда, даже если selectedConversation = null
  const companion = selectedConversation ? selectedConversation.participants.find((p) => p.id !== authContext?.user?.id) : null;

  // Фильтрация уникальных чатов по companion.id
  const uniqueConversations = useMemo(() => {
    const seen = new Set();
    return conversations.filter(conv => {
      if (!conv.participants) return false;
      const companion = conv.participants.find(p => p.id !== authContext?.user?.id);
      if (!companion) return false;
      if (seen.has(companion.id)) return false;
      seen.add(companion.id);
      return true;
    });
  }, [conversations, authContext?.user?.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, selectedConversation?.id]);

  // Автоматический выбор чата по query-параметру user
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('user');
    if (userId && conversations.length >= 0 && authContext && authContext.user) {
      // Ищем диалог с этим агентом
      const conv = conversations.find(conv =>
        conv && conv.participants &&
        conv.participants.some(p => String(p.id) === userId) &&
        conv.participants.some(p => p.id === authContext.user!.id)
      );
      if (conv) {
        // Если чат есть, но нет сообщений — подгружаем их
        if (!conv.messages || conv.messages.length === 0) {
          getMessages(conv.id).then(messages => {
            // Обновляем только поле messages, остальное не трогаем
            selectConversation({ ...conv, messages });
          });
        } else {
          selectConversation(conv);
        }
      } else {
        // Если чата нет — создаём
        createOrGetConversation(Number(userId)).then(newConv => {
          selectConversation(newConv);
        });
      }
    }
  }, [location.search, conversations, authContext]);

  useEffect(() => {
    if (companion && companion.id) {
      getPropertiesByAgent(companion.id).then((props: Property[]) => {
        setAgentProperty(props && props.length > 0 ? props[0] : null);
      });
    } else {
      setAgentProperty(null);
    }
  }, [companion]);

  // Лог участников после создания чата
  useEffect(() => {
    if (selectedConversation) {
      console.log('Выбран чат:', selectedConversation.id, 'Участники:', selectedConversation.participants);
    }
  }, [selectedConversation]);

  // Статус "печатает..." через socket.io
  useEffect(() => {
    if (!socket || !selectedConversation || !authContext?.user) return;
    const user = authContext.user;
    const handleTyping = (data: { conversationId: string; user: { id: number; firstName: string; lastName: string } }) => {
      if (data.conversationId === selectedConversation.id && data.user.id !== user.id) {
        setTypingUser(`${data.user.firstName} ${data.user.lastName}`);
        setIsTyping(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsTyping(false), 2000);
      }
    };
    socket.on('typing', handleTyping);
    return () => {
      socket.off('typing', handleTyping);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [socket, selectedConversation, authContext?.user?.id]);

  // Отправка события "печатает..."
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageContent(e.target.value);
    if (socket && selectedConversation && authContext?.user && e.target.value) {
      socket.emit('typing', {
        conversationId: selectedConversation.id,
        user: {
          id: authContext.user.id,
          firstName: authContext.user.firstName,
          lastName: authContext.user.lastName,
        },
      });
    }
  };

  if (!authContext || !authContext.user) {
    return <div>Загрузка...</div>; // Или другой индикатор загрузки
  }

  const handleSendMessage = () => {
    if (!selectedConversation || !messageContent.trim()) return;
    sendMessage(messageContent);
    setMessageContent('');
  };

  const renderChatList = () => (
    <List
      itemLayout="horizontal"
      dataSource={uniqueConversations}
      renderItem={item => {
        if (!item || !item.participants) return null;
        const companion = item.participants.find((p) => p.id !== authContext?.user?.id);
        if (!companion) return null;
        return (
          <List.Item 
              style={{
                  padding: '12px', 
                  cursor: 'pointer', 
                  borderRadius: '8px', 
                  background: selectedConversation?.id === item.id ? '#e6f7ff' : 'transparent'
              }}
              onClick={() => selectConversation(item)}
          >
              <List.Item.Meta
                  avatar={<Avatar src={companion.avatar || undefined}>{(!companion.avatar && companion.firstName && companion.lastName) ? `${companion.firstName[0]}${companion.lastName[0]}` : null}</Avatar>}
                  title={`${companion.firstName} ${companion.lastName}`}
                  description={" "}
              />
          </List.Item>
        )
      }}
    />
  );

  const renderChatWindow = () => (
    <div style={{ padding: '24px', background: '#fff', height: '100%', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
      {selectedConversation ? (
        <>
          <Title level={4}>
            Чат с {companion ? `${companion.firstName} ${companion.lastName}` : ''}
          </Title>
          {companion && (
            <div style={{
              marginBottom: 16,
              padding: '10px 16px',
              background: '#f6f8fa',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 1px 4px #eaeaea',
              minHeight: 56
            }}>
              <Avatar size={44} style={{ background: '#1890ff', fontWeight: 600 }}>
                {companion.firstName[0]}{companion.lastName[0]}
              </Avatar>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 17, color: '#222' }}>{companion.firstName} {companion.lastName}</div>
                <div style={{ fontSize: 14, color: '#888' }}>{companion.phone || '—'} · {companion.email}</div>
                {agentProperty !== null && (
                  <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
                    <span style={{ fontWeight: 500, color: '#1890ff' }}>🏠 {agentProperty.title}</span>
                    <span style={{ marginLeft: 8 }}>{agentProperty.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 470px)',
            minHeight: 200,
            marginBottom: '16px',
            padding: '10px',
            background: '#f8fafd',
            borderRadius: 16,
            boxShadow: '0 2px 12px #e6eaf1',
            scrollBehavior: 'smooth',
            transition: 'background 0.2s',
          }}>
            {messages.map((msg: Message) => {
              const isMe = msg.author.id === authContext.user?.id;
              return (
                <div
                  key={msg.id}
                  className={`chat-message-row${isMe ? ' chat-message-me' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    marginBottom: 14,
                    gap: 12,
                  }}
                >
                  <Avatar
                    size={40}
                    src={msg.author.avatar || undefined}
                    style={{
                      background: isMe ? '#1890ff' : '#e0e7ef',
                      color: isMe ? '#fff' : '#222',
                      fontWeight: 600,
                      boxShadow: isMe ? '0 2px 8px #dbeafe' : '0 1px 4px #eee',
                      border: isMe ? '2px solid #1890ff' : '2px solid #e0e7ef',
                    }}
                  >
                    {(!msg.author.avatar && msg.author.firstName && msg.author.lastName)
                      ? `${msg.author.firstName[0]}${msg.author.lastName[0]}`
                      : null}
                  </Avatar>
                  <div
                    className={`chat-message-bubble${isMe ? ' chat-message-bubble-me' : ''}`}
                    style={{
                      maxWidth: 380,
                      background: isMe ? 'linear-gradient(135deg, #1890ff 80%, #4f8cff 100%)' : '#fff',
                      color: isMe ? '#fff' : '#222',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: '12px 18px',
                      boxShadow: isMe ? '0 4px 16px #dbeafe' : '0 2px 8px #e6eaf1',
                      wordBreak: 'break-word',
                      position: 'relative',
                      fontSize: 16,
                      fontWeight: 500,
                      marginLeft: isMe ? 0 : 4,
                      marginRight: isMe ? 4 : 0,
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>{msg.content}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: isMe ? 'rgba(255,255,255,0.7)' : '#888',
                        textAlign: isMe ? 'left' : 'right',
                        marginTop: 2,
                        fontWeight: 400,
                        letterSpacing: 0.2,
                      }}
                    >
                      {msg.author.firstName} {msg.author.lastName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && typingUser && (
              <div style={{ margin: '8px 0 0 8px', color: '#888', fontStyle: 'italic', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spin size="small" />
                {typingUser} печатает...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <Input.Search
            placeholder="Введите сообщение..."
            enterButton="Отправить"
            value={messageContent}
            onChange={handleInputChange}
            onSearch={handleSendMessage}
          />
        </>
      ) : (
        <div style={{margin: 'auto'}}>
          <p>Выберите чат, чтобы начать общение</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Title level={2} style={{marginBottom: '24px'}}>Чаты</Title>
      <Tabs defaultActiveKey="1" type="card" size="large">
        <TabPane tab="Агенты" key="1">
          <Row gutter={16} style={{height: 'calc(100vh - 260px)'}}>
            <Col span={8}>
              <Search placeholder="Поиск чатов..." style={{ marginBottom: 16 }} />
              {renderChatList()}
            </Col>
            <Col span={16}>
              {renderChatWindow()}
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="Банки" key="2">
          <div style={{textAlign: 'center', padding: '50px'}}>
            <Title level={4}>Скоро здесь появятся чаты с банками</Title>
            <p>Этот функционал находится в разработке.</p>
          </div>
        </TabPane>
      </Tabs>
    </>
  );
};

export default ChatsPage; 