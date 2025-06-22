import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getRecentProperties, createProperty, getStatistics } from '../services/property.service';
import { Property, CreatePropertyData } from '../types';
import CreatePropertyForm from '../components/CreatePropertyForm';
import PropertyCard from '../components/PropertyCard';
import { Button, Modal, Spin, Alert, Row, Col, Card, Statistic, Typography } from 'antd';
import { HomeOutlined, CheckSquareOutlined, StarOutlined } from '@ant-design/icons';

const { Title } = Typography;

const DashboardPage = () => {
  const authContext = useContext(AuthContext);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState({ total: 0, forSale: 0, exclusives: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [propertiesData, statsData] = await Promise.all([
        getRecentProperties(),
        getStatistics(),
      ]);
      setProperties(propertiesData);
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
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={{ backgroundColor: '#e6f7ff' }}>
            <Statistic
              title="Всего объектов"
              value={stats.total}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={{ backgroundColor: '#f6ffed' }}>
            <Statistic
              title="В продаже"
              value={stats.forSale}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckSquareOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={{ backgroundColor: '#f9f0ff' }}>
            <Statistic
              title="Эксклюзивы"
              value={stats.exclusives}
              valueStyle={{ color: '#722ed1' }}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4}>Недавно добавленные объекты</Title>
        <Button
          type="primary"
          onClick={() => setIsModalVisible(true)}
        >
          Добавить объект
        </Button>
      </div>

      <Spin spinning={loading}>
        {error && <Alert message="Ошибка" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}
        
        <Row gutter={[16, 16]}>
          {properties.length > 0 ? (
            properties.map(property => (
              <Col xs={24} sm={12} md={8} lg={6} key={property.id}>
                <PropertyCard property={property} />
              </Col>
            ))
          ) : (
            !loading && <Col span={24}><Alert message="У вас пока нет объектов" type="info" /></Col>
          )}
        </Row>
      </Spin>

      <Modal
        title="Добавить новый объект"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <CreatePropertyForm
          onSubmit={handleCreateProperty}
          onCancel={() => setIsModalVisible(false)}
          loading={loading}
        />
      </Modal>
    </>
  );
};

export default DashboardPage; 