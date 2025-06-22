import React from 'react';
import { Card, Avatar, Typography, Space, Dropdown, Menu, Tag } from 'antd';
import { UserOutlined, EditOutlined, PhoneOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import { Client, ClientStatus } from '../types';

const { Text, Title } = Typography;

interface ClientCardProps {
  client: Client;
}

const statusMap = {
  [ClientStatus.NEW]: { text: 'Новый клиент', color: 'blue' },
  [ClientStatus.NEGOTIATION]: { text: 'Переговоры', color: 'purple' },
  [ClientStatus.CONTRACT]: { text: 'На договоре', color: 'gold' },
  [ClientStatus.DEPOSIT]: { text: 'На задатке', color: 'orange' },
  [ClientStatus.SUCCESS]: { text: 'Удачная сделка', color: 'green' },
  [ClientStatus.REFUSED]: { text: 'Отказался', color: 'red' },
};

const ClientCard: React.FC<ClientCardProps> = ({ client }) => {

  const menu = (
    <Menu>
      <Menu.Item key="1">Сменить статус</Menu.Item>
    </Menu>
  );
  
  const clientStatus = statusMap[client.status];

  return (
    <Card
      hoverable
      style={{ borderRadius: '16px' }}
      actions={[
        <EditOutlined key="edit" />,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Avatar size={48} icon={<UserOutlined />} />
          <div>
            <Title level={5} style={{ margin: 0 }}>{client.name}</Title>
            <Dropdown overlay={menu} trigger={['click']}>
              <Tag color={clientStatus.color} style={{ cursor: 'pointer', marginTop: '4px' }}>
                {clientStatus.text} ▾
              </Tag>
            </Dropdown>
          </div>
        </Space>

        <Space direction="vertical" style={{ marginTop: 16 }}>
          <Space>
            <PhoneOutlined />
            <Text>{client.phone}</Text>
          </Space>
          <Space>
            <MailOutlined />
            <Text>{client.email}</Text>
          </Space>
          <Space>
            <HomeOutlined />
            <Text underline style={{ color: '#1890ff', cursor: 'pointer' }}>3-комнатная квартира, 78 м²</Text> 
          </Space>
        </Space>
      </Space>
    </Card>
  );
};

export default ClientCard; 