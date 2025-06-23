import React, { useContext, useState } from 'react';
import { Typography, Row, Col, List, Avatar, Input, Tabs } from 'antd';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { Conversation as ConversationType, Message } from '../types';

const { Title } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

const ChatsPage: React.FC = () => {
  const { conversations, selectedConversation, selectConversation, socket } = useContext(ChatContext);
  const authContext = useContext(AuthContext);
  const [messageContent, setMessageContent] = useState('');

  if (!authContext || !authContext.user) {
    return <div>Загрузка...</div>; // Или другой индикатор загрузки
  }

  const getCompanion = (conversation: ConversationType) => {
    return conversation.participants.find((p) => p.id !== authContext?.user?.id);
  };

  const handleSendMessage = () => {
    if (!socket || !selectedConversation || !messageContent.trim()) return;

    const messageData = {
      conversationId: selectedConversation.id,
      content: messageContent,
    };

    socket.emit('sendMessage', messageData);
    setMessageContent('');
  };

  const renderChatList = () => (
    <List
      itemLayout="horizontal"
      dataSource={conversations}
      renderItem={item => {
        const companion = getCompanion(item);
        if (!companion) return null;
        
        const lastMessage = item.messages && item.messages.length > 0 ? item.messages[item.messages.length - 1] : null;

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
                  avatar={<Avatar>{companion.email[0].toUpperCase()}</Avatar>}
                  title={companion.email}
                  description={lastMessage?.content || 'Нет сообщений'}
              />
               {lastMessage && <div>{new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
          </List.Item>
        )
      }}
    />
  );

  const renderChatWindow = () => (
    <div style={{ padding: '24px', background: '#fff', height: '100%', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
      {selectedConversation ? (
        <>
          <Title level={4}>Чат с {getCompanion(selectedConversation)?.email}</Title>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', padding: '10px' }}>
            {selectedConversation.messages.map((msg: Message) => (
              <div key={msg.id} style={{
                textAlign: msg.author.id === authContext.user?.id ? 'right' : 'left',
                marginBottom: '10px'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  borderRadius: '15px',
                  background: msg.author.id === authContext.user?.id ? '#1890ff' : '#f0f0f0',
                  color: msg.author.id === authContext.user?.id ? 'white' : 'black',
                }}>
                  <p style={{ margin: 0 }}>{msg.content}</p>
                  <div style={{ fontSize: '11px', color: msg.author.id === authContext.user?.id ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)', textAlign: 'right' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Input.Search
            placeholder="Введите сообщение..."
            enterButton="Отправить"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
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