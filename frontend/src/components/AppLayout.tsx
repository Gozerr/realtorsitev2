import React, { useState, useContext, useEffect } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Badge,
  Typography,
  Space,
  Row,
  Col,
  Popover,
  Switch,
  AutoComplete,
  Button,
} from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  UserOutlined,
  TeamOutlined,
  FolderOpenOutlined,
  MessageOutlined,
  NotificationOutlined,
  ReadOutlined,
  SettingOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HeaderChatDropdown from './HeaderChatDropdown';
import NotificationDropdown from '../pages/NotificationDropdown';
import { useTheme } from '../context/ThemeContext';
import { TutorialProvider } from '../context/TutorialContext';
import TutorialOverlay from './TutorialOverlay';
import { events, courses, faq } from '../pages/EducationPage';
import { userMock, agencyMock } from '../pages/ProfilePage';
import { getRecentProperties } from '../services/property.service';
import { Property } from '../types';

// --- Заглушки для чатов и уведомлений (замените на реальные сервисы) ---
const getChats = async () => [
  { id: 1, title: 'Чат с Иваном', lastMessage: 'Добрый день!', path: '/chats/1' },
  { id: 2, title: 'Общий чат', lastMessage: 'Встреча завтра', path: '/chats/2' },
];
const getNotifications = async () => [
  { id: 1, title: 'Новое сообщение', description: 'Вам пришло новое сообщение', path: '/notifications' },
  { id: 2, title: 'Обновление объекта', description: 'Объект обновлён', path: '/notifications' },
];
// ----------------------------------------------------------------------

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', icon: <AppstoreOutlined style={{ color: '#296fff' }} />, label: 'Главная', path: '/' },
  { key: '/properties', icon: <HomeOutlined style={{ color: '#6c63ff' }} />, label: 'Объекты недвижимости', path: '/properties' },
  { key: '/clients', icon: <TeamOutlined style={{ color: '#e85aad' }} />, label: 'Мои клиенты', path: '/clients' },
  { key: '/selection', icon: <FolderOpenOutlined style={{ color: '#ff9800' }} />, label: 'Подбор', path: '/selection' },
  { key: '/chats', icon: <MessageOutlined style={{ color: '#4caf50' }} />, label: 'Чаты', path: '/chats' },
  { key: '/notifications', icon: <NotificationOutlined style={{ color: '#ff9800' }} />, label: 'Уведомления', path: '/notifications' },
  { key: '/education', icon: <ReadOutlined style={{ color: '#296fff' }} />, label: 'Обучение', path: '/education' },
  { key: '/profile', icon: <UserOutlined style={{ color: '#4caf50' }} />, label: 'Мой профиль', path: '/profile' },
  { key: '/settings', icon: <SettingOutlined style={{ color: '#888' }} />, label: 'Настройки', path: '/settings' },
];

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  const [searchData, setSearchData] = useState<any[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // 1. Недвижимость
      let properties: Property[] = [];
      try {
        properties = await getRecentProperties();
      } catch {}

      // 2. Чаты
      let chats: any[] = [];
      try {
        chats = await getChats();
      } catch {}

      // 3. Уведомления
      let notifications: any[] = [];
      try {
        notifications = await getNotifications();
      } catch {}

      // 4. Обучение, профиль, агентство
      const educationData = [
        ...events.map(ev => ({
          type: 'Мероприятие',
          label: ev.title,
          value: ev.title,
          path: '/education',
          tab: 'events',
          description: ev.description
        })),
        ...courses.map(c => ({
          type: 'Курс',
          label: c.title,
          value: c.title,
          path: '/education',
          tab: 'courses',
          description: c.description
        })),
        ...faq.map(f => ({
          type: 'FAQ',
          label: f.q,
          value: f.q,
          path: '/education',
          tab: 'faq',
          description: f.a
        })),
        {
          type: 'Профиль',
          label: userMock.firstName + ' ' + userMock.lastName,
          value: userMock.firstName + ' ' + userMock.lastName,
          path: '/profile',
          tab: 'profile',
          description: userMock.about
        },
        {
          type: 'Агентство',
          label: agencyMock.name,
          value: agencyMock.name,
          path: '/profile',
          tab: 'agency',
          description: agencyMock.description
        }
      ];

      // 5. Объекты недвижимости
      const propertyData = properties.map((p) => ({
        type: 'Объект',
        label: p.title,
        value: p.title,
        path: `/properties/${p.id}`,
        description: `${p.address} — ${p.description || ''}`
      }));

      // 6. Чаты
      const chatData = chats.map((c) => ({
        type: 'Чат',
        label: c.title,
        value: c.title,
        path: c.path || `/chats/${c.id}`,
        description: c.lastMessage || ''
      }));

      // 7. Уведомления
      const notificationData = notifications.map((n) => ({
        type: 'Уведомление',
        label: n.title,
        value: n.title,
        path: n.path || `/notifications/${n.id}`,
        description: n.description || ''
      }));

      setSearchData([
        ...propertyData,
        ...chatData,
        ...notificationData,
        ...educationData,
      ]);
    }
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleLogout = () => {
    authContext?.setAuthData(null, null);
    navigate('/login');
  };

  const handleMenuClick = (item: { key: string }) => {
    const menuItem = menuItems.find(mi => mi.key === item.key);
    if (menuItem) {
      navigate(menuItem.path);
    }
  };

  const handleProfileMenu = (key: string) => {
    setProfilePopoverOpen(false);
    if (key === 'profile') navigate('/profile');
    if (key === 'settings') navigate('/settings');
    if (key === 'logout') handleLogout();
  };

  const profilePopoverContent = (
    <div style={{ minWidth: 200 }}>
      <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
          {authContext?.user ? `${authContext.user.firstName} ${authContext.user.lastName}` : 'Пользователь'}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          {authContext?.user?.email || ''}
        </div>
      </div>
      <div style={{ padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleProfileMenu('profile')}>
        <UserOutlined style={{ marginRight: 8, color: 'var(--success-color)' }} /> Мой профиль
      </div>
      <div style={{ padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleProfileMenu('settings')}>
        <SettingOutlined style={{ marginRight: 8, color: 'var(--text-secondary)' }} /> Настройки
      </div>
      <div style={{ padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={toggleTheme}>
        {theme === 'light' ? (
          <MoonOutlined style={{ marginRight: 8, color: 'var(--text-secondary)' }} />
        ) : (
          <SunOutlined style={{ marginRight: 8, color: 'var(--text-secondary)' }} />
        )}
        {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
        <Switch 
          size="small" 
          style={{ marginLeft: 'auto' }} 
          checked={theme === 'dark'}
          onChange={toggleTheme}
        />
      </div>
      <div
        style={{
          padding: '8px 0',
          cursor: 'pointer',
          color: 'var(--error-color)',
          display: 'flex',
          alignItems: 'center',
          fontWeight: 500,
          fontSize: 15,
          transition: 'background 0.2s',
        }}
        onClick={() => handleProfileMenu('logout')}
        onMouseOver={e => (e.currentTarget.style.background = 'var(--border-light)')}
        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
      >
        <LogoutOutlined style={{ marginRight: 8, color: 'var(--error-color)', fontSize: 18 }} /> Выйти
      </div>
    </div>
  );

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (!value) {
      setSearchOptions([]);
      return;
    }
    const filtered = searchData.filter(item =>
      item.label.toLowerCase().includes(value.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(value.toLowerCase()))
    );
    setSearchOptions(filtered.map(item => ({
      value: item.value,
      label: (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span><b>{item.label}</b> <span style={{ color: '#888', fontSize: 12 }}>({item.type})</span></span>
          <span style={{ color: '#888', fontSize: 12 }}>{item.description}</span>
        </div>
      ),
      item
    })));
  };

  const handleSelect = (value: string, option: any) => {
    const item = option.item;
    if (item.path) {
      navigate(item.path);
      if (item.tab) localStorage.setItem('search_tab', item.tab);
    }
    setSearchValue('');
    setSearchOptions([]);
  };

  return (
    <TutorialProvider>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          style={{
            background: 'var(--surface-color)',
            display: 'flex',
            flexDirection: 'column',
            width: 240,
            minWidth: 240,
            maxWidth: 240,
            borderRight: '1px solid var(--border-color)',
            boxShadow: '0 0 0 1px var(--border-color)',
          }}
          width={240}
        >
          <div style={{ height: '48px', margin: '24px 0 32px 0', color: 'var(--text-primary)', textAlign: 'center', fontWeight: 700, fontSize: 24, letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <AppstoreOutlined style={{ fontSize: 28, color: 'var(--primary-color)', marginRight: 6 }} />
            РиэлтиПро
          </div>
          <Menu 
            theme="light" 
            selectedKeys={[location.pathname]}
            mode="inline"
            items={menuItems.map((item) => ({
              ...item,
              label: <span style={{ fontSize: 15, fontWeight: 400 }}>{item.label}</span>,
              style: { fontSize: 15, fontWeight: 400, height: 44, display: 'flex', alignItems: 'center' },
              className: `sidebar-${item.key.replace('/', '')}`,
              'data-menu-id': item.key
            }))}
            onClick={({ key }) => navigate(key)}
            style={{ flex: 1, borderRight: 0, background: 'var(--surface-color)' }}
          />
          <div style={{ marginTop: 'auto', padding: 0 }}>
            <div
              onClick={handleLogout}
              style={{
                width: '100%',
                background: 'var(--surface-color)',
                border: 'none',
                borderRadius: 0,
                fontSize: 15,
                fontWeight: 400,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'background 0.2s',
                height: 44,
                marginBottom: 0,
                paddingLeft: 24,
                paddingRight: 16,
                marginTop: 0,
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--border-light)')}
              onMouseOut={e => (e.currentTarget.style.background = 'var(--surface-color)')}
            >
              <LogoutOutlined style={{ fontSize: 18, marginRight: 12, color: 'var(--error-color)' }} />
              <span style={{ fontSize: 15, fontWeight: 400 }}>Выйти</span>
            </div>
          </div>
        </Sider>
        <Layout>
          <Header className="site-layout-background" style={{
            padding: '0 24px',
            background: 'var(--surface-color)',
            height: 60,
            boxShadow: '0 4px 24px var(--shadow-light)',
            display: 'flex',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}>
            <Row justify="space-between" align="middle" style={{ width: '100%' }}>
              <Col flex="1 1 0%" style={{ maxWidth: 700, marginRight: 32 }}>
                <AutoComplete
                  value={searchValue}
                  options={searchOptions}
                  style={{ width: '100%', fontSize: 18 }}
                  onSearch={handleSearch}
                  onSelect={handleSelect}
                  placeholder="Поиск по сайту..."
                  allowClear
                  filterOption={false}
                  size="large"
                  className="header-search"
                />
              </Col>
              <Col flex="none">
                <Space size="large">
                  <Popover content={<HeaderChatDropdown />} trigger="click" placement="bottomRight">
                    <Badge count={2}>
                      <MessageOutlined style={{ fontSize: '22px', cursor: 'pointer', transition: 'color 0.2s', color: 'var(--text-secondary)' }} />
                    </Badge>
                  </Popover>
                  <NotificationDropdown />
                  <SettingOutlined style={{ fontSize: '22px', cursor: 'pointer', transition: 'color 0.2s', color: 'var(--text-secondary)' }} onClick={() => navigate('/settings')} />
                  {theme === 'light' ? (
                    <SunOutlined 
                      className="theme-toggle"
                      style={{ fontSize: '22px', cursor: 'pointer', transition: 'color 0.2s', color: 'var(--text-secondary)' }} 
                      onClick={toggleTheme} 
                    />
                  ) : (
                    <MoonOutlined 
                      className="theme-toggle"
                      style={{ fontSize: '22px', cursor: 'pointer', transition: 'color 0.2s', color: 'var(--text-secondary)' }} 
                      onClick={toggleTheme} 
                    />
                  )}
                  <Popover
                    content={profilePopoverContent}
                    trigger="click"
                    open={profilePopoverOpen}
                    onOpenChange={setProfilePopoverOpen}
                    placement="bottomRight"
                  >
                    <Avatar src={authContext?.user?.photo} icon={<UserOutlined />} style={{ cursor: 'pointer', width: 38, height: 38, boxShadow: '0 2px 8px var(--shadow-light)', transition: 'box-shadow 0.2s' }} />
                  </Popover>
                </Space>
              </Col>
            </Row>
          </Header>
          <div className="site-layout-background" style={{ padding: 24, minHeight: 360, background: 'var(--background-color)' }}>
            <Outlet />
          </div>
        </Layout>
        
        {/* Кнопка "Наверх" */}
        {showScrollTop && (
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<UpOutlined />}
            onClick={scrollToTop}
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              zIndex: 1000,
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s ease',
              animation: 'fadeInUp 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
            }}
          />
        )}
      </Layout>
      
      {/* Интерактивное обучение */}
      <TutorialOverlay />
    </TutorialProvider>
  );
};

export default AppLayout; 