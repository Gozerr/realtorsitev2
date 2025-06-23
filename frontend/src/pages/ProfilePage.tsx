import React, { useState } from 'react';
import { Tabs, Input, Button, Avatar, Row, Col, Typography, Card } from 'antd';
import { UserOutlined, HomeOutlined, FileTextOutlined, CreditCardOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const userMock = {
  firstName: 'Иван',
  lastName: 'Иванов',
  phone: '+7 (999) 123-45-67',
  email: 'ivanov@realty.ru',
  about: 'Риэлтор с 5-летним опытом работы. Специализируюсь на продаже жилой недвижимости в центральном районе.',
};

const agencyMock = {
  name: 'Лидер Недвижимость',
  address: 'г. Москва, ул. Тверская, 10',
  phone: '+7 (495) 123-45-67',
  email: 'info@lider-realty.ru',
  website: 'lider-realty.ru',
  description: 'Агентство недвижимости "Лидер" работает на рынке с 2010 года. Мы специализируемся на продаже и аренде жилой и коммерческой недвижимости.',
};

const subscriptionMock = {
  plan: 'Бизнес',
  price: '5000 ₽/месяц',
  nextPayment: '15.06.2023',
  features: [
    { text: 'Неограниченное количество объектов', ok: true },
    { text: 'Доступ к базе клиентов', ok: true },
    { text: 'Интеграция с порталами недвижимости', ok: true },
    { text: 'Аналитика и отчеты', ok: true },
    { text: 'Приоритетная поддержка', ok: true },
    { text: 'API для интеграции', ok: false },
  ],
  plans: [
    { name: 'Базовый', price: '2 000 ₽ / месяц', features: ['До 50 объектов', 'Базовая аналитика', 'Интеграция с порталами (нет)'], current: false },
    { name: 'Бизнес', price: '5 000 ₽ / месяц', features: ['Неограниченное количество объектов', 'Расширенная аналитика', 'Интеграция с порталами'], current: true },
    { name: 'Премиум', price: '10 000 ₽ / месяц', features: ['Все функции Бизнес-плана', 'Приоритетная поддержка 24/7', 'API для интеграции'], current: false },
  ],
};

const offerText = `
1. Общие положения\n1.1. Настоящий документ является публичной офертой (далее — «Оферта») ООО «РиэлтиПро» (далее — «Компания») и содержит все существенные условия использования программного обеспечения «РиэлтиПро» (далее — «Сервис»).\n1.2. В соответствии с пунктом 2 статьи 437 Гражданского Кодекса Российской Федерации (ГК РФ), в случае принятия изложенных ниже условий и оплаты услуг юридическое или физическое лицо, производящее акцепт этой оферты, становится Пользователем (в соответствии с пунктом 3 статьи 438 ГК РФ акцепт оферты равносилен заключению договора на условиях, изложенных в оферте).\n\n2. Предмет оферты\n2.1. Предметом настоящей Оферты является предоставление Пользователю доступа к использованию Сервиса на условиях, изложенных в настоящей Оферте.\n2.2. Сервис представляет собой программное обеспечение для автоматизации работы агентств недвижимости и риэлторов.\n\n3. Условия использования\n3.1. Пользователь обязуется использовать Сервис только в соответствии с условиями настоящей Оферты и не нарушать права других пользователей.\n3.2. Пользователь несет ответственность за сохранность своих учетных данных и за все действия, совершенные с использованием его учетной записи.\n\n4. Стоимость услуг и порядок расчетов\n...`;

const tabItems = [
  {
    key: 'profile',
    label: <span><UserOutlined /> Мой профиль</span>,
    children: (
      <Card style={{ margin: '0 auto', marginTop: 24, boxShadow: '0 4px 24px #e6eaf1', borderRadius: 20, background: '#fff', width: '100%', maxWidth: 1200 }}>
        <Title level={4}>Личная информация</Title>
        <Text type="secondary">Управляйте своими личными данными и настройками аккаунта</Text>
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col span={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Avatar size={80} icon={<UserOutlined />} />
          </Col>
          <Col span={20}>
            <Row gutter={16}>
              <Col span={12}><Input value={userMock.firstName} disabled addonBefore="Имя" /></Col>
              <Col span={12}><Input value={userMock.lastName} disabled addonBefore="Фамилия" /></Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><Input value={userMock.phone} disabled addonBefore="Телефон" /></Col>
              <Col span={12}><Input value={userMock.email} disabled addonBefore="Email" /></Col>
            </Row>
            <Row style={{ marginTop: 12 }}>
              <Col span={24}>
                <div style={{ marginBottom: 4, color: '#888' }}>О себе</div>
                <Input.TextArea value={userMock.about} disabled rows={2} />
              </Col>
            </Row>
          </Col>
        </Row>
        <Button type="primary" style={{ marginTop: 24 }}>Редактировать</Button>
      </Card>
    ),
  },
  {
    key: 'agency',
    label: <span><HomeOutlined /> Агентство</span>,
    children: (
      <Card style={{ margin: '0 auto', marginTop: 24, boxShadow: '0 4px 24px #e6eaf1', borderRadius: 20, background: '#fff', width: '100%', maxWidth: 1200 }}>
        <Title level={4}>Информация об агентстве</Title>
        <Text type="secondary">Данные вашего агентства недвижимости</Text>
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col span={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Avatar size={80} icon={<HomeOutlined />} />
          </Col>
          <Col span={20}>
            <Row gutter={16}>
              <Col span={12}><Input value={agencyMock.name} disabled addonBefore="Название" /></Col>
              <Col span={12}><Input value={agencyMock.address} disabled addonBefore="Адрес" /></Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><Input value={agencyMock.phone} disabled addonBefore="Телефон" /></Col>
              <Col span={12}><Input value={agencyMock.email} disabled addonBefore="Email" /></Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><Input value={agencyMock.website} disabled addonBefore="Веб-сайт" /></Col>
            </Row>
            <Row style={{ marginTop: 12 }}>
              <Col span={24}>
                <div style={{ marginBottom: 4, color: '#888' }}>Описание</div>
                <Input.TextArea value={agencyMock.description} disabled rows={2} />
              </Col>
            </Row>
          </Col>
        </Row>
        <Button type="primary" style={{ marginTop: 24 }}>Редактировать</Button>
      </Card>
    ),
  },
  {
    key: 'subscription',
    label: <span><CreditCardOutlined /> Подписка</span>,
    children: (
      <Card style={{ margin: '0 auto', marginTop: 24, boxShadow: '0 4px 24px #e6eaf1', borderRadius: 20, background: '#fff', width: '100%', maxWidth: 1200 }}>
        <Title level={4}>Управление подпиской</Title>
        <Text type="secondary">Информация о вашей текущей подписке и доступных планах</Text>
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <b>Текущий план: {subscriptionMock.plan}</b> <span style={{ color: '#888' }}>{subscriptionMock.price}</span><br />
          Следующее списание: {subscriptionMock.nextPayment}
        </div>
        <ul>
          {subscriptionMock.features.map((f, i) => (
            <li key={i} style={{ color: f.ok ? '#4caf50' : '#f44336' }}>{f.ok ? '✓' : '✗'} {f.text}</li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
          {subscriptionMock.plans.map((plan, i) => (
            <Card key={i} style={{ border: plan.current ? '2px solid #296fff' : '1px solid #eee', minWidth: 220, flex: 1 }}>
              <b>{plan.name}</b><br />
              <span style={{ color: '#888' }}>{plan.price}</span>
              <ul style={{ marginTop: 8 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ color: f.includes('нет') ? '#f44336' : '#222' }}>{f}</li>
                ))}
              </ul>
              {plan.current ? <Button type="primary" disabled style={{ marginTop: 8 }}>Текущий план</Button> : <Button style={{ marginTop: 8 }}>Выбрать план</Button>}
            </Card>
          ))}
        </div>
      </Card>
    ),
  },
  {
    key: 'offer',
    label: <span><FileTextOutlined /> Оферта</span>,
    children: (
      <Card style={{ margin: '0 auto', marginTop: 24, boxShadow: '0 4px 24px #e6eaf1', borderRadius: 20, background: '#fff', width: '100%', maxWidth: 1200 }}>
        <Title level={4}>Договор оферты</Title>
        <Text type="secondary">Ознакомьтесь с условиями использования платформы</Text>
        <pre style={{ marginTop: 24, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 16 }}>{offerText}</pre>
      </Card>
    ),
  },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  return (
    <div style={{ width: '100%', padding: '32px 40px 0 40px', background: 'var(--profile-bg, #f7f9fb)', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 24 }}>Мой профиль</h1>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ background: 'transparent' }}
      />
    </div>
  );
} 