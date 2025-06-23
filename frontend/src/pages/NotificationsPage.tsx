import React, { useState, useEffect, useRef } from 'react';
import { Input, Tabs, List, Button, Badge } from 'antd';
import { UserOutlined, HomeOutlined, MessageOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

// Мок-данные уведомлений
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
    id: 4,
    type: 'objects',
    title: 'Задаток',
    description: 'Получен задаток за объект "ул. Садовая, 5"',
    time: 'Вчера, 12:45',
    isNew: false,
    icon: <HomeOutlined style={{ color: '#6c63ff' }} />,
  },
  {
    id: 5,
    type: 'reminder',
    title: 'Напоминание',
    description: 'Показ квартиры на ул. Пушкина, 15 сегодня в 18:00',
    time: 'Вчера, 09:30',
    isNew: false,
    icon: <ClockCircleOutlined style={{ color: '#ff9800' }} />,
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

const filterTabs = [
  { key: 'all', label: <>Все <Badge count={mockNotifications.length} /></> },
  { key: 'unread', label: <>Непрочитанные <Badge count={mockNotifications.filter(n => n.isNew).length} /></> },
  { key: 'clients', label: 'Клиенты' },
  { key: 'objects', label: 'Объекты' },
  { key: 'messages', label: 'Сообщения' },
  { key: 'system', label: 'Система' },
];

export default function NotificationsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState(mockNotifications);

  // Для прокрутки к уведомлению по якорю
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      setTimeout(() => {
        const el = itemRefs.current[id];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.boxShadow = '0 0 0 3px #1890ff55';
          setTimeout(() => { el.style.boxShadow = ''; }, 2000);
        }
      }, 300);
    }
  }, []);

  const filtered = notifications.filter(n => {
    if (filter === 'unread' && !n.isNew) return false;
    if (filter !== 'all' && filter !== 'unread' && n.type !== filter) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isNew: false })));
  };

  return (
    <div style={{ width: '100%', padding: '32px 40px 0 40px', background: '#f7f9fb', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 24 }}>Уведомления</h1>
      <Input.Search
        placeholder="Поиск уведомлений..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: 350, marginBottom: 16 }}
      />
      <div style={{ marginBottom: 16 }}>
        <Button onClick={markAllAsRead}>Отметить все как прочитанные</Button>
      </div>
      <Tabs
        defaultActiveKey="all"
        onChange={setFilter}
        items={filterTabs}
        style={{ marginBottom: 16 }}
      />
      <div style={{ boxShadow: '0 2px 16px #e6eaf1', borderRadius: 16, background: '#fff', padding: 8 }}>
        <List
          dataSource={filtered}
          renderItem={item => (
            <div
              key={item.id}
              id={`notification-${item.id}`}
              ref={el => { itemRefs.current[item.id] = el; }}
              style={{
                background: item.isNew ? '#eaf3ff' : '#fff',
                borderRadius: 12,
                marginBottom: 10,
                boxShadow: '0 1px 4px #f0f1f3',
                transition: 'background 0.2s, box-shadow 0.2s',
                border: item.isNew ? '1px solid #91caff' : '1px solid #f0f1f3',
                padding: 18,
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {item.icon}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: '#222' }}>
                  {item.title} {item.isNew && <Badge color="blue" text="Новое" />}
                </div>
                <div style={{ fontSize: 14, color: '#555', margin: '4px 0' }}>{item.description}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{item.time}</div>
              </div>
            </div>
          )}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
} 