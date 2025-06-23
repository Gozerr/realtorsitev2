import React, { useState } from 'react';
import { Badge, Tabs, List, Popover } from 'antd';
import { BellOutlined, UserOutlined, HomeOutlined, MessageOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Мок-данные уведомлений (дублируем для простоты)
const mockNotifications = [
  {
    id: 1,
    type: 'clients',
    title: 'Новый клиент',
    description: 'Добавлен новый клиент: Анна Смирнова',
    time: 'Сегодня, 10:30',
    isNew: true,
    icon: <UserOutlined style={{ color: '#e85aad' }} />,
  },
  {
    id: 2,
    type: 'objects',
    title: 'Изменение статуса',
    description: 'Объект "ул. Ленина, 10" забронирован',
    time: 'Сегодня, 09:15',
    isNew: true,
    icon: <HomeOutlined style={{ color: '#6c63ff' }} />,
  },
  {
    id: 3,
    type: 'messages',
    title: 'Новое сообщение',
    description: 'Сообщение от Сбербанка по ипотеке',
    time: 'Вчера, 15:20',
    isNew: false,
    icon: <MessageOutlined style={{ color: '#4caf50' }} />,
  },
  {
    id: 6,
    type: 'system',
    title: 'Системное уведомление',
    description: 'Обновление платформы будет произведено 15 мая в 03:00',
    time: '15.05.2023, 12:00',
    isNew: false,
    icon: <InfoCircleOutlined style={{ color: '#2196f3' }} />,
  },
];

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const mainNotifications = mockNotifications.filter(n => n.type !== 'system');
  const systemNotifications = mockNotifications.filter(n => n.type === 'system');
  const unreadCount = mockNotifications.filter(n => n.isNew).length;
  const navigate = useNavigate();

  const handleNotificationClick = (id: number) => {
    setOpen(false);
    navigate(`/notifications#notification-${id}`);
  };

  const content = (
    <Tabs defaultActiveKey="main" style={{ width: 320 }}>
      <Tabs.TabPane tab="Основные" key="main">
        <List
          dataSource={mainNotifications.slice(0, 3)}
          renderItem={item => (
            <List.Item onClick={() => handleNotificationClick(item.id)} style={{ cursor: 'pointer' }}>
              <List.Item.Meta
                avatar={item.icon}
                title={<span>{item.title} {item.isNew && <Badge color="blue" text="Новое" />}</span>}
                description={<>
                  <div>{item.description}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{item.time}</div>
                </>}
              />
            </List.Item>
          )}
        />
      </Tabs.TabPane>
      <Tabs.TabPane tab="Система" key="system">
        <List
          dataSource={systemNotifications.slice(0, 3)}
          renderItem={item => (
            <List.Item onClick={() => handleNotificationClick(item.id)} style={{ cursor: 'pointer' }}>
              <List.Item.Meta
                avatar={item.icon}
                title={<span>{item.title} {item.isNew && <Badge color="blue" text="Новое" />}</span>}
                description={<>
                  <div>{item.description}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{item.time}</div>
                </>}
              />
            </List.Item>
          )}
        />
      </Tabs.TabPane>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <a href="/notifications">Все уведомления</a>
      </div>
    </Tabs>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Badge count={unreadCount}>
        <BellOutlined style={{ fontSize: 22, cursor: 'pointer' }} />
      </Badge>
    </Popover>
  );
}