import React, { useContext } from 'react';
import { Menu, Avatar, List, Typography, Button, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { Conversation as ConversationType } from '../types';

const { Text } = Typography;
const { TabPane } = Tabs;

const HeaderChatDropdown: React.FC = () => {
    const navigate = useNavigate();
    const { conversations, selectConversation } = useContext(ChatContext);
    const authContext = useContext(AuthContext);

    const getCompanion = (conversation: ConversationType) => {
        return conversation.participants.find((p) => p.id !== authContext?.user?.id);
    };

    const handleAllChatsClick = () => {
        navigate('/chats');
    }

    const handleChatClick = (item: ConversationType) => {
        selectConversation(item);
        navigate(`/chats`);
    }

    const agentChats = (
        <List
            itemLayout="horizontal"
            dataSource={conversations.slice(0, 4)} // Показываем только 4 последних чата
            renderItem={item => {
                const companion = getCompanion(item);
                if (!companion) return null;
                const lastMessage = item.messages && item.messages.length > 0 ? item.messages[0] : null;

                return (
                    <List.Item style={{padding: '12px 16px', cursor: 'pointer'}} onClick={() => handleChatClick(item)}>
                        <List.Item.Meta
                            avatar={<Avatar>{companion.email[0].toUpperCase()}</Avatar>}
                            title={<Text strong>{companion.email}</Text>}
                            description={<Text ellipsis>{lastMessage?.content || 'Нет сообщений'}</Text>}
                        />
                        {lastMessage && (
                            <div style={{textAlign: 'right'}}>
                                <Text type="secondary" style={{fontSize: '12px'}}>
                                    {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </div>
                        )}
                    </List.Item>
                )
            }}
        />
    );
    
    const menu = (
        <div style={{width: '350px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: '4px'}}>
            <Tabs defaultActiveKey="1" centered>
                <TabPane tab="Агенты" key="1">
                    {agentChats}
                </TabPane>
                <TabPane tab="Банки" key="2">
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <Text type="secondary">Здесь будут чаты с банками</Text>
                    </div>
                </TabPane>
            </Tabs>
            <div style={{padding: '8px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center'}}>
                <Button type="link" onClick={handleAllChatsClick}>Все чаты</Button>
            </div>
        </div>
    );

  return menu;
};

export default HeaderChatDropdown;
