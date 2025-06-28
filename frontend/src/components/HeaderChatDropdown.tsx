import React, { useContext } from 'react';
import { Menu, Avatar, List, Typography, Button, Tabs, Badge } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { Conversation as ConversationType } from '../types';
import { HomeOutlined, MessageOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TabPane } = Tabs;

const HeaderChatDropdown: React.FC = () => {
    const navigate = useNavigate();
    const { conversations, selectConversation } = useContext(ChatContext);
    const authContext = useContext(AuthContext);

    const getCompanion = (conversation: ConversationType) => {
        return conversation.participants.find((p) => p.id !== authContext?.user?.id);
    };

    // Сортируем чаты по времени последнего сообщения (убывание)
    const sortedConversations = [...conversations].sort((a, b) => {
        const aLast = a.messages && a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].createdAt).getTime() : 0;
        const bLast = b.messages && b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].createdAt).getTime() : 0;
        return bLast - aLast;
    });

    // Считаем количество чатов с непрочитанными сообщениями для текущего пользователя
    const unreadChatsCount = sortedConversations.filter(conv =>
        conv.messages && conv.messages.some(msg =>
            msg.author.id !== authContext?.user?.id && msg.status !== 'read'
        )
    ).length;

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
            dataSource={sortedConversations.slice(0, 5)}
            renderItem={item => {
                const companion = getCompanion(item);
                if (!companion) return null;
                const property = item.property;
                // Миниатюра объекта
                const photo = property?.photos && property.photos.length > 0 ? property.photos[0] : null;
                // Краткое описание объекта
                const titleParts = [];
                if (property?.rooms) titleParts.push(`${property.rooms}-комн.`);
                if (property?.area) titleParts.push(`${property.area} м²`);
                if (property?.floor && property?.totalFloors) titleParts.push(`${property.floor}/${property.totalFloors} этаж`);
                const title = titleParts.join(', ');
                // Последнее сообщение
                const lastMessage = item.messages && item.messages.length > 0 ? item.messages[item.messages.length - 1] : null;
                const lastMsgText = lastMessage ? `${lastMessage.author.firstName}: ${lastMessage.content}` : 'Нет сообщений';
                // Есть ли непрочитанные сообщения в этом чате
                const hasUnread = item.messages && item.messages.some(msg => msg.author.id !== authContext?.user?.id && msg.status !== 'read');
                return (
                    <List.Item
                        style={{
                            padding: '4px 6px',
                            cursor: 'pointer',
                            background: hasUnread ? '#f4f8ff' : '#fff',
                            borderRadius: 6,
                            marginBottom: 2,
                            boxShadow: 'none',
                            minHeight: 36,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 1,
                            animation: 'fadeInSlide 0.35s cubic-bezier(.4,1.3,.6,1)'
                        }}
                        onClick={() => handleChatClick(item)}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                        onMouseLeave={e => e.currentTarget.style.background = hasUnread ? '#f4f8ff' : '#fff'}
                    >
                        <List.Item.Meta
                            avatar={photo ? (
                                <Avatar src={photo} shape="circle" size={28} style={{ minWidth: 28 }} />
                            ) : (
                                <Avatar style={{ background: '#1890ff', fontWeight: 600, minWidth: 28 }} size={28}>
                                    {title ? title[0] : '?'}
                                </Avatar>
                            )}
                            title={<span style={{ fontWeight: 500, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title || 'Объект'}</span>}
                            description={<span style={{ color: '#888', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lastMsgText}</span>}
                        />
                        {lastMessage && (
                            <div style={{textAlign: 'right', position: 'absolute', top: 7, right: 10}}>
                                <Text type="secondary" style={{fontSize: '10px'}}>
                                    {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </div>
                        )}
                        {hasUnread && (
                            <div style={{
                                position: 'absolute',
                                top: 8,
                                right: 2,
                                width: 5,
                                height: 5,
                                borderRadius: 3,
                                background: '#1976d2',
                                boxShadow: '0 0 0 1px #fff',
                                opacity: 0,
                                animation: 'fadeInDot 0.5s 0.1s forwards',
                            }} />
                        )}
                    </List.Item>
                )
            }}
        />
    );
    
    const menu = (
        <div style={{width: '250px', background: '#fff', boxShadow: '0 2px 8px rgba(80,120,200,0.10)', borderRadius: '6px', padding: '0', minHeight: 120}}>
            <style>{`
                @keyframes fadeInSlide {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInDot {
                  from { opacity: 0; transform: scale(0.5); }
                  to { opacity: 1; transform: scale(1); }
                }
            `}</style>
            <Tabs defaultActiveKey="1" centered tabBarStyle={{ marginBottom: 0, fontWeight: 500, fontSize: 13 }}>
                <TabPane tab="Агенты" key="1">
                    {agentChats}
                </TabPane>
                <TabPane tab="Банки" key="2">
                    <div style={{ padding: '10px', textAlign: 'center', color: '#bdbdbd', fontSize: 12 }}>
                        <Text type="secondary">Здесь будут чаты с банками</Text>
                    </div>
                </TabPane>
            </Tabs>
            <div style={{padding: '4px 8px', borderTop: '1px solid #f0f0f0', textAlign: 'center', background: '#fff', borderRadius: '0 0 6px 6px'}}>
                <Button type="link" style={{ fontWeight: 500, fontSize: 12, padding: 0, height: 22 }} onClick={handleAllChatsClick}>Все чаты</Button>
            </div>
        </div>
    );

  return menu;
};

export default HeaderChatDropdown;
