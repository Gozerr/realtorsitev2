import React, { useState, useContext } from 'react';
import {
  Layout,
  Menu,
  Input,
  Avatar,
  Badge,
  Typography,
  Space,
  Row,
  Col,
  Popover,
  Switch,
  AutoComplete,
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
  SearchOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HeaderChatDropdown from './HeaderChatDropdown';
import NotificationDropdown from '../pages/NotificationDropdown';
import { useTheme } from '../context/ThemeContext';
import { events, courses, faq } from '../pages/EducationPage';
import { userMock, agencyMock } from '../pages/ProfilePage';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '1', icon: <HomeOutlined />, label: 'Главная', path: '/' },
  { key: '2', icon: <AppstoreOutlined />, label: 'Объекты недвижимости', path: '/properties' },
  { key: '3', icon: <TeamOutlined />, label: 'Мои клиенты', path: '/clients' },
  { key: '4', icon: <FolderOpenOutlined />, label: 'Подбор', path: '/selection' },
  { key: '5', icon: <MessageOutlined />, label: 'Чаты', path: '/chats' },
  { key: '6', icon: <NotificationOutlined />, label: 'Уведомления', path: '/notifications' },
  { key: '7', icon: <ReadOutlined />, label: 'Обучение', path: '/education' },
  { key: '8', icon: <UserOutlined />, label: 'Мой профиль', path: '/profile' },
  { key: '9', icon: <SettingOutlined />, label: 'Настройки', path: '/settings' },
];

const searchData = [
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

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const [searchOptions, setSearchOptions] = useState<any[]>([]);

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
    // Темная тема — заглушка
  };

  const profilePopoverContent = (
    <div style={{ minWidth: 180 }}>
      <div style={{ padding: '8px 0', cursor: 'pointer' }} onClick={() => handleProfileMenu('profile')}>
        <UserOutlined style={{ marginRight: 8 }} /> Мой профиль
      </div>
      <div style={{ padding: '8px 0', cursor: 'pointer' }} onClick={() => handleProfileMenu('settings')}>
        <span style={{ marginRight: 8 }}><span className="anticon anticon-setting" /></span> Настройки
      </div>
      <div style={{ padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: 8 }}><span className="anticon anticon-moon" /></span> Темная тема
        <Switch size="small" style={{ marginLeft: 'auto' }} disabled />
      </div>
      <div style={{ padding: '8px 0', cursor: 'pointer', color: '#f44336' }} onClick={() => handleProfileMenu('logout')}>
        <span style={{ marginRight: 8 }}><span className="anticon anticon-logout" /></span> Выйти
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
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        style={{ display: 'flex', flexDirection: 'column', width: 260, minWidth: 260, maxWidth: 260 }}
        width={260}
      >
        <div style={{ height: '32px', margin: '16px', color: 'white', textAlign: 'center' }}>
          <Title level={4} style={{ color: 'white' }}>РиэлтиПро</Title>
        </div>
        <Menu 
          theme="dark" 
          defaultSelectedKeys={['1']} 
          mode="inline"
          items={menuItems.map((item) => ({
            ...item,
            label: <span data-tour={`sidebar-${item.key}`}>{item.label}</span>,
            style: { fontSize: 18, fontWeight: 500 }
          }))}
          onClick={handleMenuClick}
          style={{ flex: 1, borderRight: 0 }}
        />
        <Menu 
          theme="dark" 
          mode="inline"
          onClick={handleLogout}
          items={[
            { key: '10', icon: <LogoutOutlined />, label: <span data-tour="sidebar-logout">Выйти</span>, style: { fontSize: 18, fontWeight: 500 } }
          ]}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: '0 16px', background: '#fff' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <AutoComplete
                value={searchValue}
                options={searchOptions}
                style={{ width: 320 }}
                onSearch={handleSearch}
                onSelect={handleSelect}
                placeholder="Поиск по сайту..."
                allowClear
                filterOption={false}
              />
            </Col>
            <Col>
              <Space size="large">
                <Popover content={<HeaderChatDropdown />} trigger="click" placement="bottomRight">
                    <Badge count={2}>
                      <MessageOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
                    </Badge>
                </Popover>
                <NotificationDropdown />
                <SettingOutlined style={{ fontSize: '20px', cursor: 'pointer' }} onClick={() => navigate('/settings')} />
                {theme === 'light' ? (
                  <SunOutlined style={{ fontSize: '20px', cursor: 'pointer' }} onClick={toggleTheme} />
                ) : (
                  <MoonOutlined style={{ fontSize: '20px', cursor: 'pointer' }} onClick={toggleTheme} />
                )}
                <Popover
                  content={profilePopoverContent}
                  trigger="click"
                  open={profilePopoverOpen}
                  onOpenChange={setProfilePopoverOpen}
                  placement="bottomRight"
                >
                  <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
                </Popover>
              </Space>
            </Col>
          </Row>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout; 