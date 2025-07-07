import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getRecentProperties, createProperty, getStatistics, getAllProperties } from '../services/property.service';
import { Property, CreatePropertyData } from '../types';
import CreatePropertyForm from '../components/CreatePropertyForm';
import PropertyCard from '../components/PropertyCard';
import { Button, Modal, Spin, Alert, Row, Col, Card, Statistic, Typography, Divider, Empty, Checkbox, Popover, Tooltip } from 'antd';
import { HomeOutlined, CheckSquareOutlined, StarOutlined, PlusOutlined, FireOutlined, CalendarOutlined, TrophyOutlined, UserAddOutlined, RiseOutlined, DollarOutlined, TeamOutlined, SettingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { getClients } from '../services/client.service';
import FlipNumbers from 'react-flip-numbers';
import { io, Socket } from 'socket.io-client';
import { useStatsSocket } from '../hooks/useStatsSocket';
import { SmartAvatar } from '../components/SmartAvatar';

const { Title } = Typography;

const STAT_METRICS = [
  { key: 'soldCount', label: 'Продано объектов', icon: <TrophyOutlined /> },
  { key: 'clientsCount', label: 'Клиентов в базе', icon: <TeamOutlined /> },
  { key: 'newClientsMonth', label: 'Новых клиентов за месяц', icon: <UserAddOutlined /> },
  { key: 'maxSoldPrice', label: 'Самый дорогой объект', icon: <DollarOutlined /> },
  { key: 'salesGrowth', label: 'Динамика продаж', icon: <RiseOutlined /> },
];

const SOCKET_IO_URL = 'http://localhost:3001';

const QUOTES = [
  'Успех — это движение от неудачи к неудаче без потери энтузиазма.',
  'Каждый день — новый шанс изменить свою жизнь.',
  'Лучшее время посадить дерево было 20 лет назад. Второе лучшее — сегодня.',
  'Секрет успеха — начать.',
];

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

interface AgentProperty {
  status?: string;
  price?: number | string;
  createdAt?: string;
}

interface AgentClient {
  createdAt?: string;
  status?: string;
}

const AGENT_METRICS = [
  {
    key: 'sold',
    label: 'Продано вами',
    icon: <CheckSquareOutlined style={{ fontSize: 26, color: '#059669' }} />,
    getValue: (props: AgentProperty[], clients: AgentClient[], stats?: any) => stats?.soldCount ?? props.filter((p: AgentProperty) => ['sold', 'продан', 'продано'].includes((p.status || '').toLowerCase())).length,
  },
  {
    key: 'maxPrice',
    label: 'Самый дорогой объект',
    icon: <DollarOutlined style={{ fontSize: 26, color: '#f59e42' }} />,
    getValue: (props: AgentProperty[], clients: AgentClient[], stats?: any) => {
      if (stats?.maxSoldPrice && stats?.maxSoldPrice !== '0') return `${Number(stats.maxSoldPrice).toLocaleString()} ₽`;
      const sold = props.filter((p: AgentProperty) => ['sold', 'продан', 'продано'].includes((p.status || '').toLowerCase()));
      const max = sold.reduce((m: number, p: AgentProperty) => Math.max(m, Number(p.price) || 0), 0);
      return max ? `${max.toLocaleString()} ₽` : '-';
    },
    valueStyle: { whiteSpace: 'nowrap', fontSize: 18 },
  },
  {
    key: 'salesGrowth',
    label: 'Динамика продаж',
    icon: <RiseOutlined style={{ fontSize: 26, color: '#3b82f6' }} />,
    getValue: (props: AgentProperty[], clients: AgentClient[], stats?: any) => stats?.salesGrowth ?? 0,
  },
  {
    key: 'clients',
    label: 'Клиентов в работе',
    icon: <TeamOutlined style={{ fontSize: 26, color: '#3b82f6' }} />,
    getValue: (props: AgentProperty[], clients: AgentClient[], stats?: any) => stats?.clientsCount ?? clients.filter((c: AgentClient) => (c.status || '').toLowerCase() === 'в работе').length,
  },
  {
    key: 'newClientsMonth',
    label: 'Новых клиентов за месяц',
    icon: <UserAddOutlined style={{ fontSize: 26, color: '#f59e42' }} />,
    getValue: (props: AgentProperty[], clients: AgentClient[], stats?: any) => stats?.newClientsMonth ?? (() => {
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return clients.filter((c: AgentClient) => c.createdAt && new Date(c.createdAt) > monthAgo).length;
    })(),
  },
];

const DEFAULT_AGENT_METRICS = ['sold', 'clients', 'maxPrice'];

const DashboardPage = () => {
  const authContext = useContext(AuthContext);
  const userContext = useUserContext() || {};
  const { userData } = userContext;
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agentProperties, setAgentProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, any>>({});
  const animationRef = useRef<any>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('dashboardMetrics') || 'null') || ['soldCount', 'clientsCount', 'newClientsMonth', 'maxSoldPrice'];
  });
  const [showSettings, setShowSettings] = useState(false);
  const stats = useStatsSocket();
  const [quote] = useState(getRandomQuote());
  const displayMetrics = stats || metrics;
  const userName = authContext?.user?.firstName || 'Агент';
  const avatarUrl = authContext?.user?.avatar || '';
  const today = new Date();
  const dateString = today.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const [selectedAgentMetrics, setSelectedAgentMetrics] = useState(() => {
    return JSON.parse(localStorage.getItem('dashboardAgentMetrics') || 'null') || DEFAULT_AGENT_METRICS;
  });
  const [showAgentSettings, setShowAgentSettings] = useState(false);

  useEffect(() => {
    if (stats) {
      setMetrics(stats);
    }
  }, [stats]);

  // Функция для определения времени суток и приветствия
  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = authContext?.user?.firstName || 'Агент';
    
    if (hour >= 5 && hour < 12) {
      return `Доброе утро, ${userName}!`;
    } else if (hour >= 12 && hour < 18) {
      return `Добрый день, ${userName}!`;
    } else {
      return `Добрый вечер, ${userName}!`;
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [recentProperties, statsData] = await Promise.all([
        getRecentProperties(),
        getStatistics(),
      ]);
      setProperties(
        Array.isArray(recentProperties)
          ? recentProperties
          : ((recentProperties as any).properties || [])
      );
      setMetrics(statsData);
    } catch (err) {
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentData = async () => {
    if (!userData) return;
    try {
      const propsRes = await getAllProperties();
      console.log('userData:', userData);
      console.log('all properties:', propsRes.properties);
      // Автоматический подбор agentId
      let agentId = userData.id;
      if (!propsRes.properties.some((p: Property) => p.agent?.id === agentId)) {
        for (const key of Object.keys(userData)) {
          if (propsRes.properties.some((p: Property) => p.agent?.id === userData[key])) {
            agentId = userData[key];
            console.log('Matched agentId by key', key, ':', agentId);
            break;
          }
        }
      }
      const agentProps = propsRes.properties.filter((p: Property) => p.agent?.id === agentId);
      console.log('Final agentId for filter:', agentId);
      console.log('agentProperties:', agentProps);
      setAgentProperties(agentProps);
      if (authContext?.token) {
        const clientsRes = await getClients(authContext.token);
        console.log('all clients:', clientsRes);
        setClients(clientsRes);
      }
    } catch (e) {
      // ...
    }
  };

  useEffect(() => {
    fetchDashboardData(); // только при монтировании
  }, []);

  useEffect(() => {
    fetchAgentData(); // при монтировании и смене userData/token
  }, [userData, authContext?.token]);

  useEffect(() => {
    if (stats) {
      setMetrics(stats);
      fetchAgentData(); // обновлять agentProperties и clients при каждом statsUpdate
    }
  }, [stats]);

  // Простая анимация чисел
  useEffect(() => {
    if (!metrics) return;
    if (animationRef.current) clearInterval(animationRef.current);
    const keys = Object.keys(metrics);
    let frame = 0;
    const duration = 20; // кадров анимации
    const start = { ...animatedMetrics };
    const end = { ...metrics };
    animationRef.current = setInterval(() => {
      frame++;
      const next: any = {};
      keys.forEach(k => {
        if (typeof end[k] === 'number') {
          const s = typeof start[k] === 'number' ? start[k] : 0;
          next[k] = Math.round(s + (end[k] - s) * (frame / duration));
        } else {
          next[k] = end[k];
        }
      });
      setAnimatedMetrics(next);
      if (frame >= duration) {
        clearInterval(animationRef.current);
        setAnimatedMetrics(end);
      }
    }, 20);
    return () => clearInterval(animationRef.current);
  }, [metrics]);

  const handleMetricChange = (checkedValues: any) => {
    setSelectedMetrics(checkedValues);
    localStorage.setItem('dashboardMetrics', JSON.stringify(checkedValues));
  };

  return (
    <div style={{ 
      background: 'var(--background-color)',
      minHeight: '100vh',
      padding: '24px 0'
    }}>
      <div style={{ width: '100%' }}>
        {/* Современный приветственный блок с метриками */}
        <div
          className="dashboard-welcome-card"
          style={{
            marginBottom: 32,
            padding: '32px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 40px var(--shadow-color), 0 8px 16px var(--shadow-light)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            animation: 'fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1)'
          }}
        >
          {/* Аватар */}
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SmartAvatar src={avatarUrl} size={72} style={{ boxShadow: '0 4px 16px #dbeafe', border: '3px solid #fff' }} />
          </div>
          {/* Приветствие и цитата */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Добро пожаловать, {userName}! <span role="img" aria-label="wave">👋</span></span>
            </div>
            <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 8, fontStyle: 'italic' }}>
              “{quote}”
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 0 }}>{dateString}</div>
          </div>
          {/* Метрики: статистика агента */}
          <div style={{ display: 'flex', gap: 24, flex: '0 0 auto', alignItems: 'center', minWidth: 320 }}>
            {AGENT_METRICS.filter(m => selectedAgentMetrics.includes(m.key)).map(m => (
              <div key={m.key} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 90, padding: '10px 0', borderRadius: 12, background: 'none', boxShadow: 'none', flex: '0 1 110px', marginBottom: 4, transition: 'box-shadow 0.3s',
              }}>
                {m.icon}
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', lineHeight: 1, ...(m.valueStyle || {}) }}>{m.getValue(agentProperties, clients, stats)}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2, textAlign: 'center', lineHeight: 1.2 }}>{m.label}</div>
              </div>
            ))}
          </div>
          <Popover
            content={
              <Checkbox.Group
                options={AGENT_METRICS.map(m => ({ label: m.label, value: m.key }))}
                value={selectedAgentMetrics}
                onChange={checked => {
                  setSelectedAgentMetrics(checked);
                  localStorage.setItem('dashboardAgentMetrics', JSON.stringify(checked));
                }}
                style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}
              />
            }
            title="Выберите метрики"
            trigger="click"
            open={showAgentSettings}
            onOpenChange={setShowAgentSettings}
            placement="bottomRight"
          >
            <SettingOutlined style={{ fontSize: 22, color: '#888', cursor: 'pointer', marginLeft: 18 }} onClick={() => setShowAgentSettings(!showAgentSettings)} />
          </Popover>
        </div>

        {/* Statistics Cards */}
        <Row className="dashboard-stats" gutter={[24, 24]} style={{ marginBottom: 32, justifyContent: 'center' }}>
          <Col xs={24} sm={12} md={6} lg={6}>
            <div style={{
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '18px',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)',
              padding: '28px 18px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              minHeight: 120,
              transition: 'box-shadow 0.3s',
              position: 'relative',
              overflow: 'hidden',
              animation: 'fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1)'
            }}>
              <HomeOutlined style={{ fontSize: 38, color: '#2563eb', marginBottom: 8 }} />
              <div style={{ fontSize: 36, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, letterSpacing: 1, textShadow: '0 2px 8px #e0e7ef' }}>{displayMetrics.totalCount ?? '-'}</div>
              <div style={{ fontSize: 15, color: '#2563eb', marginTop: 6, fontWeight: 600 }}>Всего объектов</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <div style={{
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '18px',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)',
              padding: '28px 18px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              minHeight: 120,
              transition: 'box-shadow 0.3s',
              position: 'relative',
              overflow: 'hidden',
              animation: 'fadeInUp 0.8s cubic-bezier(.23,1.01,.32,1)'
            }}>
              <CheckSquareOutlined style={{ fontSize: 38, color: '#059669', marginBottom: 8 }} />
              <div style={{ fontSize: 36, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, letterSpacing: 1, textShadow: '0 2px 8px #e0e7ef' }}>{displayMetrics.forSaleCount ?? '-'}</div>
              <div style={{ fontSize: 15, color: '#059669', marginTop: 6, fontWeight: 600 }}>В продаже</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <div style={{
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '18px',
              boxShadow: '0 8px 32px 0 rgba(255, 193, 7, 0.10)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)',
              padding: '28px 18px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              minHeight: 120,
              transition: 'box-shadow 0.3s',
              position: 'relative',
              overflow: 'hidden',
              animation: 'fadeInUp 0.9s cubic-bezier(.23,1.01,.32,1)'
            }}>
              <StarOutlined style={{ fontSize: 38, color: '#f59e42', marginBottom: 8 }} />
              <div style={{ fontSize: 36, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, letterSpacing: 1, textShadow: '0 2px 8px #e0e7ef' }}>{displayMetrics.newThisMonth ?? '-'}</div>
              <div style={{ fontSize: 15, color: '#f59e42', marginTop: 6, fontWeight: 600 }}>Новые за месяц</div>
            </div>
          </Col>
          {typeof displayMetrics.reservedCount !== 'undefined' && (
            <Col xs={24} sm={12} md={6} lg={6}>
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: '18px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '28px 18px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                minHeight: 120,
                transition: 'box-shadow 0.3s',
                position: 'relative',
                overflow: 'hidden',
                animation: 'fadeInUp 1s cubic-bezier(.23,1.01,.32,1)'
              }}>
                <FireOutlined style={{ fontSize: 38, color: '#eab308', marginBottom: 8 }} />
                <div style={{ fontSize: 36, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, letterSpacing: 1, textShadow: '0 2px 8px #e0e7ef' }}>{displayMetrics.reservedCount ?? '-'}</div>
                <div style={{ fontSize: 15, color: '#eab308', marginTop: 6, fontWeight: 600 }}>В резерве</div>
              </div>
            </Col>
          )}
          {typeof displayMetrics.pledgedCount !== 'undefined' && (
            <Col xs={24} sm={12} md={6} lg={6}>
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: '18px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '28px 18px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                minHeight: 120,
                transition: 'box-shadow 0.3s',
                position: 'relative',
                overflow: 'hidden',
                animation: 'fadeInUp 1.1s cubic-bezier(.23,1.01,.32,1)'
              }}>
                <StarOutlined style={{ fontSize: 38, color: '#a855f7', marginBottom: 8 }} />
                <div style={{ fontSize: 36, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, letterSpacing: 1, textShadow: '0 2px 8px #e0e7ef' }}>{displayMetrics.pledgedCount ?? '-'}</div>
                <div style={{ fontSize: 15, color: '#a855f7', marginTop: 6, fontWeight: 600 }}>На задатке</div>
              </div>
            </Col>
          )}
          {typeof displayMetrics.soldCount !== 'undefined' && (
            <Col xs={24} sm={12} md={6} lg={6}>
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: '18px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '28px 18px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                minHeight: 120,
                transition: 'box-shadow 0.3s',
                position: 'relative',
                overflow: 'hidden',
                animation: 'fadeInUp 1.2s cubic-bezier(.23,1.01,.32,1)'
              }}>
                <CheckSquareOutlined style={{ fontSize: 38, color: '#f43f5e', marginBottom: 8 }} />
                <div style={{ fontSize: 36, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, letterSpacing: 1, textShadow: '0 2px 8px #e0e7ef' }}>{displayMetrics.soldCount ?? '-'}</div>
                <div style={{ fontSize: 15, color: '#f43f5e', marginTop: 6, fontWeight: 600 }}>Продано</div>
              </div>
            </Col>
          )}
        </Row>

        {/* Properties Section */}
        <Card 
          style={{ 
            borderRadius: '16px',
            boxShadow: '0 8px 32px var(--shadow-light)',
            border: 'none',
            background: 'var(--card-background)'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 24,
            padding: '0 8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FireOutlined style={{ fontSize: '24px', color: 'var(--warning-color)' }} />
              <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>
                Недавно добавленные объекты
              </Title>
            </div>
          </div>

          <Divider style={{ margin: '16px 0 24px 0' }} />

          <Spin spinning={loading}>
            {error && <Alert message="Ошибка" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}
            
            <Row gutter={[24, 24]} style={{ margin: 0 }}>
              {properties.map(property => (
                <Col xs={24} sm={12} md={8} lg={8} key={property.id} style={{ display: 'flex' }}>
                  <PropertyCard property={property} allowStatusEdit={false} />
                </Col>
              ))}
            </Row>
          </Spin>
        </Card>

        <Link to="/calendar">
          <Button icon={<CalendarOutlined />} size="large" style={{ margin: 8 }}>
            Календарь событий
          </Button>
        </Link>
      </div>

      <style>{`
        @media (max-width: 991px) {
          .welcome-section {
            padding: 12px !important;
            margin-bottom: 12px !important;
          }
          .dashboard-stats .ant-col {
            width: 100% !important;
            max-width: 100% !important;
            flex: 0 0 100% !important;
          }
          .dashboard-stats .ant-card {
            margin-bottom: 12px !important;
          }
          .ant-typography, .ant-typography h1, .ant-typography h2, .ant-typography h3 {
            font-size: 18px !important;
          }
          .ant-btn, .ant-btn-lg {
            width: 100% !important;
            margin-bottom: 8px !important;
          }
          .dashboard-cards-row {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .ant-divider {
            margin: 8px 0 !important;
          }
        }
        @media (max-width: 575px) {
          .welcome-section {
            padding: 6px !important;
            margin-bottom: 6px !important;
          }
          .dashboard-stats .ant-card {
            padding: 8px !important;
          }
          .ant-typography, .ant-typography h1, .ant-typography h2, .ant-typography h3 {
            font-size: 15px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage; 