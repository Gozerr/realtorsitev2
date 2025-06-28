import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { Typography, Row, Col, List, Avatar, Input, Tabs, Spin } from 'antd';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { Conversation as ConversationType, Message, Property } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { createOrGetConversation, getMessages } from '../services/chat.service';
import { getPropertiesByAgent } from '../services/property.service';
import { getNameGender } from '../utils/petrovichUtil';
import { HomeOutlined, SendOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

declare global {
  interface Window {
    petrovich: any;
  }
}

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
  const navigate = useNavigate();

  // Получаем companion всегда, даже если selectedConversation = null
  const companion = selectedConversation ? selectedConversation.participants.find((p) => p.id !== authContext?.user?.id) : null;

  // Фильтрация уникальных чатов по паре (companion.id, property.id)
  const uniqueConversations = useMemo(() => {
    const seen = new Set();
    return conversations.filter(conv => {
      if (!conv.participants || !conv.property) return false;
      const companion = conv.participants.find(p => p.id !== authContext?.user?.id);
      if (!companion) return false;
      const key = `${companion.id}_${conv.property.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
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
    const propertyId = params.get('property');
    if (userId && propertyId && conversations.length >= 0 && authContext && authContext.user) {
      // Ищем диалог с этим агентом и этим объектом
      const conv = conversations.find(conv =>
        conv && conv.participants &&
        conv.participants.some(p => String(p.id) === userId) &&
        conv.participants.some(p => p.id === authContext.user!.id) &&
        conv.property && String(conv.property.id) === propertyId
      );
      if (conv) {
        // Если чат есть, но нет сообщений — подгружаем их
        if (!conv.messages || conv.messages.length === 0) {
          getMessages(conv.id).then(messages => {
            selectConversation({ ...conv, messages });
          });
        } else {
          selectConversation(conv);
        }
      } else {
        // Если чата нет — создаём
        createOrGetConversation(Number(userId), Number(propertyId)).then(newConv => {
          selectConversation(newConv);
        });
      }
    }
  }, [location.search, conversations, authContext]);

  // Реакция на появление нового чата (newConversation) при наличии query user/property
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('user');
    const propertyId = params.get('property');
    if (userId && propertyId && conversations.length > 0 && authContext && authContext.user) {
      const conv = conversations.find(conv =>
        conv && conv.participants &&
        conv.participants.some(p => String(p.id) === userId) &&
        conv.participants.some(p => p.id === authContext.user!.id) &&
        conv.property && String(conv.property.id) === propertyId
      );
      if (conv) {
        selectConversation(conv);
      }
    }
  }, [conversations, location.search, authContext]);

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

  // Функция для склонения ФИО в творительном падеже с логированием
  const getCompanionNameInstrumental = (companion: any) => {
    if (!companion) return '';
    try {
      const gender = getNameGender(companion);
      if (!window.petrovich) {
        console.warn('petrovich не определён! Проверьте подключение petrovich.min.js');
        return `${companion.firstName} ${companion.lastName}`;
      }
      const person = {
        first: companion.firstName,
        last: companion.lastName,
        gender: gender
      };
      const result = window.petrovich(person, 'instrumental');
      console.log('petrovich склонение:', result, person);
      return result.first + ' ' + result.last;
    } catch (e) {
      console.error('petrovich error', e, companion);
      return `${companion.firstName} ${companion.lastName}`;
    }
  };

  // Если появился новый чат и нет выбранного, автоматически выбираем первый чат
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      selectConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  if (!authContext || !authContext.user) {
    return <div>Загрузка...</div>; // Или другой индикатор загрузки
  }

  const handleSendMessage = () => {
    if (!selectedConversation || !messageContent.trim()) return;
    sendMessage(messageContent);
    setMessageContent('');
  };

  // SVG-галочки
  const DoubleCheck = ({ color = '#bbb', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: 6, verticalAlign: 'middle' }}>
      <path d="M7.5 13.5L3.5 9.5L2 11L7.5 16.5L18 6L16.5 4.5L7.5 13.5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.5 13.5L8.5 10.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const renderChatList = () => (
    <List
      itemLayout="horizontal"
      dataSource={uniqueConversations}
      renderItem={item => {
        if (!item || !item.participants || !item.property) return null;
        const photo = (item.property.photos && item.property.photos.length > 0 && item.property.photos[0])
          || (item.property.images && item.property.images.length > 0 && item.property.images[0])
          || null;
        // Мини-превью последнего сообщения
        const lastMsg = item.messages && item.messages.length > 0 ? item.messages[item.messages.length - 1] : null;
        return (
          <List.Item
            style={{
              padding: '4px 0',
              cursor: 'pointer',
              borderRadius: '6px',
              background: selectedConversation?.id === item.id ? '#e6f7ff' : 'transparent',
              transition: 'background 0.2s',
            }}
            onClick={() => selectConversation(item)}
            onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
            onMouseLeave={e => e.currentTarget.style.background = selectedConversation?.id === item.id ? '#e6f7ff' : 'transparent'}
          >
            <List.Item.Meta
              avatar={
                photo ? (
                  <Avatar src={photo} shape="circle" size={32} />
                ) : (
                  <Avatar style={{ background: '#1890ff', fontWeight: 600 }} size={32}>
                    {item.property.title ? item.property.title[0] : '?'}
                  </Avatar>
                )
              }
              title={item.property.title || item.property.address || 'Объект'}
              description={
                <>
                  <div style={{ color: '#888', fontSize: 12 }}>{item.property.address || ''}</div>
                  {lastMsg && <div style={{ color: '#bbb', fontSize: 11, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{lastMsg.author.firstName}: {lastMsg.content}</div>}
                </>
              }
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
              <Avatar size={44} src={companion.photo || companion.avatar || undefined} style={{ background: '#1890ff', fontWeight: 600 }}>
                {(!companion.photo && !companion.avatar && companion.firstName && companion.lastName) ? `${companion.firstName[0]}${companion.lastName[0]}` : null}
              </Avatar>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 17, color: '#222' }}>{companion.firstName} {companion.lastName}</div>
                <div style={{ fontSize: 14, color: '#888' }}>{companion.phone || '—'} · {companion.email}</div>
                {/* Информация об объекте */}
                {selectedConversation?.property && (
                  <div style={{ marginTop: 6, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HomeOutlined style={{ color: '#1890ff', fontSize: 18, cursor: 'pointer' }} onClick={() => navigate(`/properties/${selectedConversation.property.id}`)} />
                    <span
                      style={{ color: '#1890ff', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
                      onClick={() => navigate(`/properties/${selectedConversation.property.id}`)}
                    >
                      {selectedConversation.property.title}
                      {selectedConversation.property.rooms ? `, ${selectedConversation.property.rooms}-комн.` : ''}
                      {selectedConversation.property.area ? `, ${selectedConversation.property.area} м²` : ''}
                      {selectedConversation.property.floor && selectedConversation.property.totalFloors ? `, ${selectedConversation.property.floor}/${selectedConversation.property.totalFloors} этаж` : ''}
                    </span>
                    <span style={{ color: '#555', marginLeft: 8 }}>
                      {selectedConversation.property.address}
                    </span>
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
            {messages.map((msg: Message, idx) => {
              const isMe = msg.author.id === authContext.user?.id;
              // Определяем, последнее ли это моё сообщение (для "прочитано")
              const isLastMyMsg = isMe && [...messages].reverse().find(m => m.author.id === authContext.user?.id)?.id === msg.id;
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
                  {/* Аватар собеседника у его сообщений */}
                  {!isMe && (
                    <Avatar
                      size={32}
                      src={msg.author.photo || msg.author.avatar || undefined}
                      style={{ background: '#e0e7ef', color: '#222', fontWeight: 600 }}
                    >
                      {(!msg.author.photo && !msg.author.avatar && msg.author.firstName && msg.author.lastName)
                        ? `${msg.author.firstName[0]}${msg.author.lastName[0]}`
                        : null}
                    </Avatar>
                  )}
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
                        display: 'flex',
                        justifyContent: isMe ? 'flex-start' : 'flex-end',
                        alignItems: 'center',
                      }}
                    >
                      {msg.author.firstName} {msg.author.lastName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && (
                        isLastMyMsg
                          ? <DoubleCheck color="#22c55e" size={18} /> // зелёные галочки
                          : <DoubleCheck color="#bbb" size={18} /> // серые галочки
                      )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Input
              placeholder="Введите сообщение..."
              value={messageContent}
              onChange={handleInputChange}
              onPressEnter={e => { if (!e.shiftKey) { handleSendMessage(); e.preventDefault(); } }}
              style={{
                borderRadius: 24,
                boxShadow: '0 2px 8px #e6eaf1',
                fontSize: 16,
                padding: '10px 18px',
                flex: 1,
                background: '#f8fafc',
              }}
              onKeyDown={e => {
                if (e.ctrlKey && e.key === 'Enter') handleSendMessage();
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                background: 'linear-gradient(135deg, #1890ff 80%, #4f8cff 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 24,
                padding: '0 18px',
                height: 40,
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px #e6eaf1',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.2s',
              }}
            >
              <SendOutlined style={{ fontSize: 20 }} />
            </button>
          </div>
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