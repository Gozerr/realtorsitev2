import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getRecentProperties, createProperty, getStatistics, getAllProperties } from '../services/property.service';
import { Property, CreatePropertyData } from '../types';
import CreatePropertyForm from '../components/CreatePropertyForm';
import PropertyCard from '../components/PropertyCard';
import { Button, Modal, Spin, Alert, Row, Col, Card, Statistic, Typography, Divider, Empty } from 'antd';
import { HomeOutlined, CheckSquareOutlined, StarOutlined, PlusOutlined, FireOutlined, CalendarOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title } = Typography;

const DashboardPage = () => {
  const authContext = useContext(AuthContext);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState({ total: 0, forSale: 0, exclusives: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

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
      const [propertiesData, statsData] = await Promise.all([
        getAllProperties(),
        getStatistics(),
      ]);
      setProperties(propertiesData.properties.slice(0, 20));
      setStats(statsData);
    } catch (err) {
      setError('Failed to fetch dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateProperty = async (propertyData: CreatePropertyData) => {
    if (authContext?.token) {
      setLoading(true);
      setError('');
      try {
        await createProperty(propertyData, authContext.token);
        fetchDashboardData();
        setIsModalVisible(false);
      } catch (err) {
        setError('Failed to create property.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ 
      background: 'var(--background-color)',
      minHeight: '100vh',
      padding: '24px 0'
    }}>
      <div style={{ width: '100%' }}>
        {/* Welcome Section */}
        <div className="welcome-section" style={{ 
          marginBottom: 32,
          padding: '32px',
          background: 'var(--card-background)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 40px var(--shadow-color), 0 8px 16px var(--shadow-light)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Декоративные элементы */}
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '120px',
            height: '120px',
            background: 'var(--gradient-secondary)',
            borderRadius: '50%',
            zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  marginBottom: '8px' 
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: 'var(--gradient-primary)',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }} />
                  <span style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-secondary)', 
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {new Date().toLocaleDateString('ru-RU', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <Title level={1} style={{ 
                  margin: 0, 
                  color: '#000000',
                  fontSize: '2.5rem',
                  fontWeight: '700'
                }}>
                  {getGreeting()}
                </Title>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '24px 20px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                minWidth: '100px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '6px',
                  height: '6px',
                  background: 'var(--success-color)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
                <div style={{ 
                  fontSize: '28px', 
                  color: 'var(--text-primary)', 
                  fontWeight: '800',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                  letterSpacing: '-0.5px',
                  lineHeight: '1'
                }}>
                  {new Date().toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                  })}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  opacity: 0.8
                }}>
                  {new Date().toLocaleDateString('ru-RU', { 
                    day: '2-digit', 
                    month: '2-digit',
                    year: '2-digit'
                  })}
                </div>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '20px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  background: 'var(--success-color)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
                <span style={{ fontSize: '14px', color: 'var(--success-color)', fontWeight: '500' }}>
                  Система активна
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '20px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  background: 'var(--info-color)',
                  borderRadius: '50%'
                }} />
                <span style={{ fontSize: '14px', color: 'var(--info-color)', fontWeight: '500' }}>
                  {authContext?.user?.role === 'agent' ? 'Агент' : 'Директор'}
                </span>
              </div>
            </div>
            
            <p style={{ 
              fontSize: '16px', 
              color: 'var(--text-secondary)', 
              margin: '16px 0 0 0',
              lineHeight: '1.6',
              maxWidth: '600px'
            }}>
              Добро пожаловать в вашу панель управления недвижимостью. Здесь вы можете эффективно управлять объектами, клиентами и сделками.
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <Row className="dashboard-stats" gutter={[16, 16]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Card 
              style={{ 
                background: 'var(--gradient-primary)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px var(--shadow-light)',
                border: 'none',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              hoverable
              bodyStyle={{ padding: '24px' }}
            >
              <Statistic
                title={<span style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Всего объектов</span>}
                value={stats.total}
                valueStyle={{ color: 'var(--text-primary)', fontSize: '32px', fontWeight: 'bold' }}
                prefix={<HomeOutlined style={{ color: 'var(--primary-color)', fontSize: '24px' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Card 
              style={{ 
                background: 'var(--gradient-secondary)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px var(--shadow-light)',
                border: 'none',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              hoverable
              bodyStyle={{ padding: '24px' }}
            >
              <Statistic
                title={<span style={{ color: 'var(--text-primary)', fontSize: '16px' }}>В продаже</span>}
                value={stats.forSale}
                valueStyle={{ color: 'var(--text-primary)', fontSize: '32px', fontWeight: 'bold' }}
                prefix={<CheckSquareOutlined style={{ color: 'var(--secondary-color)', fontSize: '24px' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Card 
              style={{ 
                background: 'var(--gradient-tertiary)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px var(--shadow-light)',
                border: 'none',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              hoverable
              bodyStyle={{ padding: '24px' }}
            >
              <Statistic
                title={<span style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Эксклюзивы</span>}
                value={stats.exclusives}
                valueStyle={{ color: 'var(--text-primary)', fontSize: '32px', fontWeight: 'bold' }}
                prefix={<StarOutlined style={{ color: 'var(--info-color)', fontSize: '24px' }} />}
              />
            </Card>
          </Col>
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
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
              style={{
                background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 15px var(--shadow-light)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Добавить объект
            </Button>
          </div>

          <Divider style={{ margin: '16px 0 24px 0' }} />

          <Spin spinning={loading}>
            {error && <Alert message="Ошибка" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}
            
            <Row gutter={[24, 24]} style={{ margin: 0 }}>
              {properties.map(property => (
                <Col xs={24} sm={12} md={8} lg={8} key={property.id} style={{ display: 'flex' }}>
                  <PropertyCard property={property} />
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

      <Modal
        title="Добавить новый объект"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        style={{ top: 20 }}
      >
        <CreatePropertyForm
          onSubmit={handleCreateProperty}
          onCancel={() => setIsModalVisible(false)}
          loading={loading}
        />
      </Modal>

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