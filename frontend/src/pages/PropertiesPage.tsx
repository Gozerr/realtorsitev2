import React, { useState, useEffect } from 'react';
import { Table, Typography, Tag, Input, Button, Space, Row, Col } from 'antd';
import { getRecentProperties } from '../services/property.service';
import { Property, PropertyStatus } from '../types';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;

const statusColors = {
  [PropertyStatus.FOR_SALE]: 'green',
  [PropertyStatus.IN_DEAL]: 'gold',
  [PropertyStatus.SOLD]: 'red',
};

const statusText = {
  [PropertyStatus.FOR_SALE]: 'В продаже',
  [PropertyStatus.IN_DEAL]: 'В сделке',
  [PropertyStatus.SOLD]: 'Продано',
};

const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'all'>('all');

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const data = await getRecentProperties();
        setProperties(data);
      } catch (error) {
        console.error("Failed to fetch properties", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);
  
  const filteredProperties = properties
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => 
      p.title.toLowerCase().includes(searchText.toLowerCase()) ||
      p.address.toLowerCase().includes(searchText.toLowerCase())
    );

  const columns = [
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Property) => <Typography.Text strong>{record.title}</Typography.Text>,
    },
    {
      title: 'Адрес',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `${price.toLocaleString('ru-RU')} ₽`,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: PropertyStatus) => (
        <Tag color={statusColors[status]}>{statusText[status]}</Tag>
      ),
    },
    {
      title: 'Эксклюзив',
      dataIndex: 'isExclusive',
      key: 'isExclusive',
      render: (isExclusive: boolean) => 
        isExclusive 
          ? <CheckCircleOutlined style={{ color: 'green', fontSize: '18px' }} /> 
          : <CloseCircleOutlined style={{ color: 'red', fontSize: '18px' }} />,
    },
     {
      title: 'Действия',
      key: 'action',
      render: (_: any, record: Property) => (
        <Space size="middle">
          <Button type="link">Подробнее</Button>
          <Button type="link" danger>Удалить</Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Title level={2}>Объекты недвижимости</Title>
      <Row justify="space-between" align="middle">
        <Col>
           <Space>
            <Button type={statusFilter === 'all' ? 'primary' : 'default'} onClick={() => setStatusFilter('all')}>Все</Button>
            <Button type={statusFilter === PropertyStatus.FOR_SALE ? 'primary' : 'default'} onClick={() => setStatusFilter(PropertyStatus.FOR_SALE)}>В продаже</Button>
            <Button type={statusFilter === PropertyStatus.SOLD ? 'primary' : 'default'} onClick={() => setStatusFilter(PropertyStatus.SOLD)}>Продано</Button>
           </Space>
        </Col>
        <Col>
          <Search
            placeholder="Поиск по названию или адресу"
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredProperties}
        loading={loading}
        rowKey="id"
      />
    </Space>
  );
};

export default PropertiesPage; 