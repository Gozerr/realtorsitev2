import React, { useState } from 'react';
import { Tabs, Input, Button, Switch, Select, Card, Typography } from 'antd';

const { Title, Text } = Typography;

const generalTab = (
  <Card style={{ margin: '0 auto', marginTop: 24, boxShadow: '0 4px 24px #e6eaf1', borderRadius: 20, background: '#fff', width: '100%', maxWidth: 1200 }}>
    <Title level={4}>Общие настройки</Title>
    <Text type="secondary">Управляйте основными настройками вашего аккаунта</Text>
    <div style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 12 }}>Язык интерфейса</div>
      <Select defaultValue="Русский" style={{ width: 240, marginBottom: 16 }}>
        <Select.Option value="Русский">Русский</Select.Option>
        <Select.Option value="English">English</Select.Option>
      </Select>
      <div style={{ marginBottom: 12 }}>Часовой пояс</div>
      <Select defaultValue="Москва (GMT+3)" style={{ width: 240, marginBottom: 16 }}>
        <Select.Option value="Москва (GMT+3)">Москва (GMT+3)</Select.Option>
        <Select.Option value="Калининград (GMT+2)">Калининград (GMT+2)</Select.Option>
      </Select>
      <div style={{ marginBottom: 12 }}>Формат даты</div>
      <Input defaultValue="ДД.MM.ГГГГ" style={{ width: 240, marginBottom: 24 }} />
      <Button type="primary">Сохранить изменения</Button>
    </div>
  </Card>
);

const notificationsTab = (
  <Card style={{ margin: '0 auto', marginTop: 24, boxShadow: '0 4px 24px #e6eaf1', borderRadius: 20, background: '#fff', width: '100%', maxWidth: 1200 }}>
    <Title level={4}>Настройки уведомлений</Title>
    <Text type="secondary">Настройте способы получения уведомлений</Text>
    <div style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 12 }}>Уведомления <Switch defaultChecked style={{ marginLeft: 8 }} /></div>
      <div style={{ marginBottom: 12 }}>Email уведомления <Switch defaultChecked style={{ marginLeft: 8 }} /></div>
      <div style={{ marginBottom: 12 }}>SMS уведомления <Switch style={{ marginLeft: 8 }} /></div>
      <div style={{ marginBottom: 12 }}>Email для уведомлений</div>
      <Input defaultValue="your@email.com" style={{ width: 240, marginBottom: 16 }} />
      <div style={{ marginBottom: 12 }}>Телефон для SMS</div>
      <Input defaultValue="+7 (___) ___-__-__" style={{ width: 240, marginBottom: 24 }} />
      <Button type="primary">Сохранить изменения</Button>
    </div>
  </Card>
);

const appearanceTab = (
  <Card style={{ margin: '0 auto', marginTop: 24, boxShadow: '0 4px 24px #e6eaf1', borderRadius: 20, background: '#fff', width: '100%', maxWidth: 1200 }}>
    <Title level={4}>Внешний вид</Title>
    <Text type="secondary">Настройте внешний вид приложения</Text>
    <div style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 12 }}>Темная тема <Switch style={{ marginLeft: 8 }} /></div>
      <div style={{ marginBottom: 12 }}>Размер шрифта</div>
      <Select defaultValue="Средний" style={{ width: 240, marginBottom: 16 }}>
        <Select.Option value="Мелкий">Мелкий</Select.Option>
        <Select.Option value="Средний">Средний</Select.Option>
        <Select.Option value="Крупный">Крупный</Select.Option>
      </Select>
      <div style={{ marginBottom: 12, marginTop: 16 }}>Предпросмотр</div>
      <div style={{ color: '#888' }}>Текст мелкого размера</div>
      <div>Текст среднего размера</div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>Текст крупного размера</div>
      <div style={{ fontWeight: 700, fontSize: 22, marginTop: 8 }}>Заголовок</div>
      <Button type="primary" style={{ marginTop: 24 }}>Сохранить изменения</Button>
    </div>
  </Card>
);

const apiTab = (
  <Card style={{ margin: '0 auto', marginTop: 24, boxShadow: '0 4px 24px #e6eaf1', borderRadius: 20, background: '#fff', width: '100%', maxWidth: 1200 }}>
    <Title level={4}>API и интеграции</Title>
    <Text type="secondary">Управляйте API ключами и интеграциями с другими сервисами</Text>
    <div style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 12 }}>API ключ</div>
      <Input.Password defaultValue="1234567890abcdef" style={{ width: 300, marginBottom: 16 }} />
      <Button style={{ marginLeft: 8, marginRight: 8 }}>Показать</Button>
      <Button>Обновить</Button>
      <div style={{ marginTop: 24, marginBottom: 12 }}>Интеграции с CRM-системами</div>
      <Card style={{ marginBottom: 8 }}>
        <b>Bitrix24</b><br />Синхронизация клиентов и сделок с Bitrix24 <Button style={{ float: 'right' }}>Подключить</Button>
      </Card>
      <Card style={{ marginBottom: 8 }}>
        <b>amoCRM</b><br />Интеграция с amoCRM для управления сделками <Button style={{ float: 'right' }}>Подключить</Button>
      </Card>
      <Card style={{ marginBottom: 8 }}>
        <b>Мегаплан</b><br />Синхронизация задач и клиентов с Мегапланом <Button style={{ float: 'right' }}>Подключить</Button>
      </Card>
      <Card style={{ marginBottom: 8 }}>
        <b>Salesforce</b><br />Интеграция с Salesforce CRM <Button style={{ float: 'right' }}>Подключить</Button>
      </Card>
      <Button type="primary" style={{ marginTop: 24 }}>Сохранить изменения</Button>
    </div>
  </Card>
);

const tabItems = [
  { key: 'general', label: 'Общие', children: generalTab },
  { key: 'notifications', label: 'Уведомления', children: notificationsTab },
  { key: 'appearance', label: 'Внешний вид', children: appearanceTab },
  { key: 'api', label: 'API и интеграции', children: apiTab },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  return (
    <div style={{ width: '100%', padding: '32px 40px 0 40px', background: 'var(--settings-bg, #f7f9fb)', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 24 }}>Настройки</h1>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ background: 'transparent' }}
      />
    </div>
  );
} 