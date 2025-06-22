import React from 'react';
import { Card, Typography, Tag, Space, Button } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Property } from '../types';

const { Title, Text } = Typography;

interface PropertyCardProps {
  property: Property;
}

// Это временная заглушка для фото
const ImagePlaceholder = () => (
  <div style={{
    background: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    color: '#bfbfbf'
  }}>
    <UserOutlined style={{ fontSize: 48 }} />
  </div>
);

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  return (
    <Card
      hoverable
      cover={<ImagePlaceholder />}
      actions={[
        <Button type="text" icon={<EditOutlined />}>Подробнее</Button>,
        <Button type="text" icon={<DeleteOutlined />} danger>Удалить</Button>,
        <Button type="text" icon={<PlusOutlined />}>Добавить</Button>,
      ]}
    >
      <Card.Meta
        title={<Title level={5}>{property.title}</Title>}
        description={property.address}
      />
      <div style={{ marginTop: '16px' }}>
        <Title level={4}>{property.price.toLocaleString('ru-RU')} ₽</Title>
        <Text type="secondary">Добавлено: 2 дня назад</Text>
      </div>
      <Space style={{ marginTop: '16px' }}>
          <Tag color="purple">Эксклюзив</Tag>
          <Tag color="green">В продаже</Tag>
      </Space>
    </Card>
  );
};

export default PropertyCard; 