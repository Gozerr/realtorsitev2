// src/pages/PropertiesPage.tsx
import React, { useEffect, useState } from 'react';
import { getRecentProperties } from '../services/property.service';
import { Property } from '../types';
import PropertyCard from '../components/PropertyCard';
import { Row, Col, Spin, Alert, Typography } from 'antd';

const { Title } = Typography;

const PropertiesPage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getRecentProperties()
      .then(setProperties)
      .catch(() => setError('Не удалось загрузить объекты'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Title level={3}>Все объекты недвижимости</Title>
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
            !loading && <Col span={24}><Alert message="Нет объектов" type="info" /></Col>
          )}
        </Row>
      </Spin>
    </>
  );
};

export default PropertiesPage;