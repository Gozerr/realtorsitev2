import React, { useState, useContext, useEffect, useRef } from 'react';
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
  Tooltip,
  Alert,
  Drawer,
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
  CalendarOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationDropdown from '../pages/NotificationDropdown';
import { useTheme } from '../context/ThemeContext';
import { getRecentProperties } from '../services/property.service';
import { Property } from '../types';
import { fetchEducationEvents, EducationEvent } from '../services/education.service';
import styles from './AppLayout.module.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', icon: <AppstoreOutlined style={{ color: '#296fff' }} />, label: 'Главная', path: '/' },
  { key: '/properties', icon: <HomeOutlined style={{ color: '#6c63ff' }} />, label: 'Объекты недвижимости', path: '/properties' },
  { key: '/clients', icon: <TeamOutlined style={{ color: '#e85aad' }} />, label: 'Мои клиенты', path: '/clients' },
  { key: '/my-chats', icon: <MessageOutlined style={{ color: '#1976d2' }} />, label: 'Мои чаты', path: '/my-chats' },
  { key: '/selection', icon: <FolderOpenOutlined style={{ color: '#ff9800' }} />, label: 'Подбор', path: '/selection' },
  { key: '/notifications', icon: <NotificationOutlined style={{ color: '#ff9800' }} />, label: 'Уведомления', path: '/notifications' },
  { key: '/education', icon: <ReadOutlined style={{ color: '#296fff' }} />, label: 'Обучение', path: '/education' },
  { key: '/profile', icon: <UserOutlined style={{ color: '#4caf50' }} />, label: 'Мой профиль', path: '/profile' },
  { key: '/settings', icon: <SettingOutlined style={{ color: '#888' }} />, label: 'Настройки', path: '/settings' },
];

// Для интеграции с туториалом
const TUTORIAL_STEP_KEY = 'realtor_tutorial_step';
const tutorialMenuMap: Record<number, string> = {
  0: '/', // Главная
  1: '/properties',
  2: '/clients',
  3: '/selection',
  4: '/notifications',
  5: '/education',
  6: '/profile',
  7: '/settings',
};

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
  const [isOnline, setIsOnline] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Определяем, мобильный ли экран
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchData() {
      // 1. Недвижимость
      let properties: Property[] = [];
      try {
        properties = await getRecentProperties();
      } catch {}

      // 2. Чаты
      // let chats: any[] = [];
      // try {
      //   chats = await getChats();
      // } catch {}

      // 3. Уведомления
      // let notifications: any[] = [];
      // try {
      //   notifications = await getNotifications();
      // } catch {}

      // 4. Обучение, профиль, агентство
      let educationEvents: EducationEvent[] = [];
      try {
        educationEvents = await fetchEducationEvents();
      } catch {}
      const events = educationEvents.filter(ev => ev.type === 'event' || ev.type === 'webinar');
      const courses = educationEvents.filter(ev => ev.type === 'course');
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
        {
          type: 'Профиль',
          label: authContext?.user?.firstName + ' ' + authContext?.user?.lastName,
          value: authContext?.user?.firstName + ' ' + authContext?.user?.lastName,
          path: '/profile',
          tab: 'profile',
          description: ''
        },
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
      // const chatData = chats.map((c) => ({
      //   type: 'Чат',
      //   label: c.title,
      //   value: c.title,
      //   path: c.path || `/chats/${c.id}`,
      //   description: c.lastMessage || ''
      // }));

      // 7. Уведомления
      // const notificationData = notifications.map((n) => ({
      //   type: 'Уведомление',
      //   label: n.title,
      //   value: n.title,
      //   path: n.path || `/notifications/${n.id}`,
      //   description: n.description || ''
      // }));

      setSearchData([
        ...propertyData,
        ...educationData,
      ]);
    }
    fetchData();
  }, [authContext]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(window.navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
        <Tooltip title="Профиль">
          <UserOutlined style={{ marginRight: 8, color: 'var(--success-color)' }} /> Мой профиль
        </Tooltip>
      </div>
      <div style={{ padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleProfileMenu('settings')}>
        <Tooltip title="Настройки">
          <SettingOutlined style={{ marginRight: 8, color: 'var(--text-secondary)' }} /> Настройки
        </Tooltip>
      </div>
      <div style={{ padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={toggleTheme}>
        {theme === 'light' ? (
          <Tooltip title="Темная тема">
            <MoonOutlined style={{ marginRight: 8, color: 'var(--text-secondary)' }} />
          </Tooltip>
        ) : (
          <Tooltip title="Светлая тема">
            <SunOutlined style={{ marginRight: 8, color: 'var(--text-secondary)' }} />
          </Tooltip>
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
        <Tooltip title="Выйти">
          <LogoutOutlined style={{ marginRight: 8, color: 'var(--error-color)', fontSize: 18 }} />
        </Tooltip>
        Выйти
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

  // После монтирования добавляем data-tutorial к DOM-элементам меню
  useEffect(() => {
    const menuMap = [
      { key: '/', tutorial: 'sidebar-main' },
      { key: '/properties', tutorial: 'sidebar-properties' },
      { key: '/clients', tutorial: 'sidebar-clients' },
      { key: '/selection', tutorial: 'sidebar-selection' },
      { key: '/notifications', tutorial: 'sidebar-notifications' },
      { key: '/education', tutorial: 'sidebar-education' },
      { key: '/profile', tutorial: 'sidebar-profile' },
      { key: '/settings', tutorial: 'sidebar-settings' },
    ];
    menuMap.forEach(({ key, tutorial }) => {
      const el = document.querySelector(`.ant-menu-item[data-menu-id='${key}']`);
      if (el) el.setAttribute('data-tutorial', tutorial);
    });
    // Поиск
    const searchInput = document.querySelector('.header-search input');
    if (searchInput) searchInput.setAttribute('data-tutorial', 'header-search');
    // Уведомления (ищем иконку колокольчика)
    const notifIcon = document.querySelector('.anticon-bell');
    if (notifIcon) notifIcon.setAttribute('data-tutorial', 'header-notifications');
    // Календарь (ищем кнопку с иконкой календаря)
    const calendarBtn = document.querySelector('.ant-btn .anticon-calendar');
    if (calendarBtn && calendarBtn.parentElement) calendarBtn.parentElement.setAttribute('data-tutorial', 'header-calendar');
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sider для десктопа, Drawer для мобильных */}
      {!isMobile ? (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={240}
          className={styles.sidebar}
          breakpoint="lg"
          trigger={null}
        >
          <div style={{ height: '48px', margin: '24px 0 32px 0', color: 'var(--text-primary)', textAlign: 'center', fontWeight: 700, fontSize: 24, letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <AppstoreOutlined style={{ fontSize: 28, color: 'var(--primary-color)', marginRight: 6 }} />
            РиэлтиПро
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={handleMenuClick}
            style={{ flex: 1, borderRight: 0 }}
            items={menuItems.map(item => {
              return { ...item, 'data-menu-id': item.key };
            })}
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
              <Tooltip title="Выйти">
                <LogoutOutlined style={{ fontSize: 18, marginRight: 12, color: 'var(--error-color)' }} />
              </Tooltip>
              <span style={{ fontSize: 15, fontWeight: 400 }}>Выйти</span>
            </div>
          </div>
        </Sider>
      ) : (
        <Drawer
          title="Меню"
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          bodyStyle={{ padding: 0 }}
          width={220}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={item => {
              handleMenuClick(item);
              setMobileMenuOpen(false);
            }}
            items={menuItems.map(item => {
              return { ...item, 'data-menu-id': item.key };
            })}
            style={{ height: '100%', borderRight: 0 }}
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
              <Tooltip title="Выйти">
                <LogoutOutlined style={{ fontSize: 18, marginRight: 12, color: 'var(--error-color)' }} />
              </Tooltip>
              <span style={{ fontSize: 15, fontWeight: 400 }}>Выйти</span>
            </div>
          </div>
        </Drawer>
      )}
      {/* Основной контент */}
      <Layout style={{ marginLeft: 240 }}>
        <Layout.Header
          className={styles.headerFixed + ' site-layout-background'}
          style={{
            padding: isMobile ? '0 8px' : '0 24px',
            height: isMobile ? 56 : 64,
            boxShadow: '0 2px 8px rgba(40,60,90,0.10)',
            borderBottom: '1px solid #e6eaf1',
            display: 'flex',
            alignItems: 'center',
            position: 'fixed',
            top: 0,
            left: isMobile ? 0 : 240,
            width: isMobile ? '100vw' : 'calc(100vw - 240px)',
            zIndex: 1100,
            transition: 'left 0.2s, width 0.2s',
          }}
        >
          {isMobile && (
            <Tooltip title="Меню">
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: 24 }} />}
                onClick={() => setMobileMenuOpen(true)}
                style={{ marginRight: 16 }}
              />
            </Tooltip>
          )}
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
                <NotificationDropdown />
                <Link to="/calendar" style={{ marginLeft: 16 }}>
                  <Tooltip title="Календарь">
                    <Button
                      type="text"
                      icon={<CalendarOutlined style={{ fontSize: 24, color: '#1976d2', cursor: 'pointer' }} />}
                      onClick={() => navigate('/calendar')}
                    />
                  </Tooltip>
                </Link>
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
                  <Avatar src={authContext?.user?.photo || authContext?.user?.avatar || undefined} icon={<UserOutlined />} style={{ cursor: 'pointer', width: 38, height: 38, boxShadow: '0 2px 8px var(--shadow-light)', transition: 'box-shadow 0.2s' }}>
                    {(!authContext?.user?.photo && !authContext?.user?.avatar && authContext?.user?.firstName && authContext?.user?.lastName) ? `${authContext.user.firstName[0]}${authContext.user.lastName[0]}` : null}
                  </Avatar>
                </Popover>
              </Space>
            </Col>
          </Row>
        </Layout.Header>
        <div
          className="site-layout-background"
          style={{
            padding: 24,
            minHeight: 360,
            background: 'var(--background-color)',
            marginLeft: 0,
            paddingTop: isMobile ? 56 : 64,
            marginRight: 0,
          }}
        >
          <Outlet />
        </div>
      </Layout>
      
      {/* Кнопка "Наверх" */}
      <Tooltip title="Наверх">
        <Button
          type="primary"
          shape="circle"
          icon={<UpOutlined />}
          size="large"
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            right: 24,
            bottom: isMobile ? 80 : 40,
            zIndex: 2000,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            display: showScrollTop ? 'block' : 'none',
            background: '#296fff',
            color: '#fff',
            border: 'none',
            transition: 'bottom 0.3s',
          }}
        />
      </Tooltip>
    </Layout>
  );
};

export default AppLayout; 