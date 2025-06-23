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
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HeaderChatDropdown from './HeaderChatDropdown';

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

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    authContext?.setAuthData(null, null);
  };

  const handleMenuClick = (item: { key: string }) => {
    const menuItem = menuItems.find(mi => mi.key === item.key);
    if (menuItem) {
      navigate(menuItem.path);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ height: '32px', margin: '16px', color: 'white', textAlign: 'center' }}>
          <Title level={4} style={{ color: 'white' }}>РиэлтиПро</Title>
        </div>
        <Menu 
          theme="dark" 
          defaultSelectedKeys={['1']} 
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
          style={{ flex: 1, borderRight: 0 }}
        />
        <Menu 
          theme="dark" 
          mode="inline"
          onClick={handleLogout}
          items={[
            { key: '10', icon: <LogoutOutlined />, label: 'Выйти' }
          ]}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: '0 16px', background: '#fff' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Input prefix={<SearchOutlined />} placeholder="Поиск..." />
            </Col>
            <Col>
              <Space size="large">
                <Popover content={<HeaderChatDropdown />} trigger="click" placement="bottomRight">
                    <Badge count={2}>
                      <MessageOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
                    </Badge>
                </Popover>
                <Badge count={3}>
                  <NotificationOutlined style={{ fontSize: '20px' }} />
                </Badge>
                <SunOutlined style={{ fontSize: '20px' }} />
                <Avatar icon={<UserOutlined />} />
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