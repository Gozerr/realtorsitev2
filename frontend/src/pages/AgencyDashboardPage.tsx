import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Typography, Tabs, Card, Row, Col, Statistic, Button, Divider } from 'antd';
import { TeamOutlined, UserOutlined, HomeOutlined, BellOutlined, CalendarOutlined, SettingOutlined, ApiOutlined, BookOutlined } from '@ant-design/icons';
import { getAllProperties } from '../services/property.service';
import { getClients } from '../services/client.service';
import { Property, Client } from '../types';
// Импортировать остальные сервисы по мере необходимости

const { Title } = Typography;

const AgencyDashboardPage = () => {
  const authContext = useContext(AuthContext);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  // TODO: добавить состояния для агентов, руководителей, уведомлений, календаря, обучения, интеграций

  useEffect(() => {
    // Загрузка объектов агентства
    getAllProperties().then(res => setProperties(res.properties));
    // Загрузка клиентов агентства
    if (authContext?.token) {
      getClients(authContext.token).then(setClients);
    }
    // TODO: загрузить агентов, руководителей, уведомления, календарь, обучение, интеграции
  }, [authContext?.token]);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Моё агентство</Title>
      <Tabs defaultActiveKey="analytics">
        <Tabs.TabPane tab={<><TeamOutlined /> Аналитика</>} key="analytics">
          <Row gutter={16}>
            <Col span={6}><Card><Statistic title="Объекты" value={properties.length} prefix={<HomeOutlined />} /></Card></Col>
            <Col span={6}><Card><Statistic title="Клиенты" value={clients.length} prefix={<UserOutlined />} /></Card></Col>
            {/* TODO: добавить статистику по продажам, динамике, эффективности агентов */}
          </Row>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><TeamOutlined /> Агенты</>} key="agents">
          {/* TODO: управление агентами (список, добавление, редактирование, удаление, назначение ролей) */}
          <div>Управление агентами (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><UserOutlined /> Руководители</>} key="managers">
          {/* TODO: управление руководителями */}
          <div>Управление руководителями (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><HomeOutlined /> Объекты</>} key="properties">
          {/* TODO: список объектов с фильтрами */}
          <div>Список объектов (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><UserOutlined /> Клиенты</>} key="clients">
          {/* TODO: список клиентов с фильтрами */}
          <div>Список клиентов (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><BellOutlined /> Уведомления</>} key="notifications">
          {/* TODO: уведомления */}
          <div>Уведомления (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><CalendarOutlined /> Календарь</>} key="calendar">
          {/* TODO: календарь событий агентства */}
          <div>Календарь событий (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><BookOutlined /> Обучение</>} key="education">
          {/* TODO: обучение и развитие */}
          <div>Обучение и развитие (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><SettingOutlined /> Настройки</>} key="settings">
          {/* TODO: настройки агентства */}
          <div>Настройки агентства (в разработке)</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<><ApiOutlined /> Интеграции</>} key="integrations">
          {/* TODO: интеграции */}
          <div>Интеграции (в разработке)</div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default AgencyDashboardPage; 