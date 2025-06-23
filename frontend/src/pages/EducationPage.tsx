import React, { useState, useEffect } from 'react';
import { Tabs, Card, Button, Badge, Row, Col, Typography, Tag, Collapse, message } from 'antd';
import { CalendarOutlined, BookOutlined, QuestionCircleOutlined, ClockCircleOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const events = [
  {
    id: 1,
    title: 'Основы работы с клиентами',
    type: 'Семинар',
    description: 'Базовый курс по работе с клиентами в сфере недвижимости. Научитесь эффективно выявлять потребности к...',
    date: '15.06.2023',
    time: '10:00 - 13:00',
    place: 'Офис компании, ул. Тверская, 10',
    participants: '12 из 20 участников',
    price: 'Бесплатно',
  },
  {
    id: 2,
    title: 'Юридические аспекты сделок с недвижимостью',
    type: 'Мастер-класс',
    description: 'Курс по правовым аспектам сделок с недвижимостью. Разбор типичных юридических проблем и способы их р...',
    date: '20.06.2023',
    time: '14:00 - 18:00',
    place: 'Бизнес-центр "Престиж", ул. Ленина, 15, конференц-зал',
    participants: '8 из 15 участников',
    price: '2 500 ₽',
  },
  {
    id: 3,
    title: 'Маркетинг недвижимости в социальных сетях',
    type: 'Вебинар',
    description: 'Практический курс по продвижению объектов недвижимости через социальные сети. Стратегии, инструменты...',
    date: '25.06.2023',
    time: '11:00 - 16:00',
    place: 'Онлайн (Zoom)',
    participants: '23 из 50 участников',
    price: '1 800 ₽',
  },
];

const courses = [
  {
    id: 1,
    title: 'Базовый курс риэлтора',
    level: 'Начинающий',
    description: 'Комплексный курс для начинающих риэлторов. Основы работы с клиентами, юридические аспекты, маркетинг...',
    duration: '4 недели',
    lessons: 12,
    price: '15 000 ₽',
  },
  {
    id: 2,
    title: 'Продвинутые техники продаж недвижимости',
    level: 'Продвинутый',
    description: 'Курс для опытных риэлторов, желающих повысить свою эффективность и увеличить продажи...',
    duration: '3 недели',
    lessons: 9,
    price: '20 000 ₽',
  },
  {
    id: 3,
    title: 'Ипотечное кредитование',
    level: 'Средний',
    description: 'Все аспекты ипотечного кредитования: программы банков, условия, процесс оформления, типичные проблемы...',
    duration: '2 недели',
    lessons: 6,
    price: '12 000 ₽',
  },
];

const faq = [
  { q: 'Как добавить новый объект недвижимости?', a: 'Перейдите в раздел "Объекты недвижимости" и нажмите кнопку "Добавить объект".' },
  { q: 'Как изменить статус объекта?', a: 'В карточке объекта выберите нужный статус из выпадающего списка.' },
  { q: 'Как добавить клиента в систему?', a: 'В разделе "Мои клиенты" нажмите "Добавить клиента" и заполните форму.' },
  { q: 'Как создать подборку объектов для клиента?', a: 'В карточке клиента выберите "Создать подборку".' },
  { q: 'Как связаться с агентом объекта?', a: 'В карточке объекта есть контактные данные агента.' },
  { q: 'Как настроить уведомления?', a: 'В разделе "Настройки" выберите вкладку "Уведомления".' },
  { q: 'Как создать область поиска объектов?', a: 'В разделе "Подбор" используйте фильтры и сохраните область поиска.' },
  { q: 'Как запустить обучение по работе с системой?', a: 'Нажмите кнопку "Запустить обучение" в разделе FAQ.' },
];

const tip = (
  <Card style={{ background: '#f5faff', border: '1px solid #b3e5fc', marginBottom: 16 }}>
    <b>💡 Совет</b>
    <div style={{ marginTop: 8 }}>
      Вы можете запустить интерактивное обучение по работе с платформой, нажав на кнопку ниже. Система проведет вас по основным разделам и объяснит их функциональность.
    </div>
    <Button type="primary" style={{ marginTop: 12 }} onClick={() => window.dispatchEvent(new CustomEvent('startOnboarding'))}>
      Запустить обучение
    </Button>
  </Card>
);

function startOnboarding() {
  message.info('Интерактивное обучение: 1. Главная — ваш дашборд. 2. Объекты — управление недвижимостью. 3. Мои клиенты — база клиентов. 4. Подбор — подборки для клиентов. 5. Чаты — общение с агентами. 6. Уведомления — все события. 7. Обучение — курсы и FAQ. 8. Профиль и настройки — управление аккаунтом.');
}

export default function EducationPage() {
  const [tab, setTab] = useState('events');
  useEffect(() => {
    window.addEventListener('startOnboarding', startOnboarding);
    if (!localStorage.getItem('onboardingDone')) {
      setTimeout(() => window.dispatchEvent(new CustomEvent('startOnboarding')), 1000);
      localStorage.setItem('onboardingDone', '1');
    }
    return () => window.removeEventListener('startOnboarding', startOnboarding);
  }, []);

  return (
    <div style={{ width: '100%', padding: '32px 40px 0 40px', background: 'var(--edu-bg, #f7f9fb)', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 24 }}>Обучение</h1>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'events', label: <><CalendarOutlined /> Мероприятия</>, children: (
            <Row gutter={[24, 24]}>
              {events.map(ev => (
                <Col xs={24} sm={12} md={8} key={ev.id}>
                  <Card style={{ borderRadius: 18, boxShadow: '0 2px 12px #e6eaf1', minHeight: 340 }}>
                    <div style={{ height: 120, background: '#f0f2f5', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="" alt="img" style={{ width: 60, height: 60, opacity: 0.2 }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 18 }}>{ev.title} <Tag color="blue">{ev.type}</Tag></div>
                    <div style={{ color: '#555', margin: '8px 0 12px 0' }}>{ev.description}</div>
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}><ClockCircleOutlined /> {ev.date} &nbsp; {ev.time}</div>
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}><EnvironmentOutlined /> {ev.place}</div>
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}><TeamOutlined /> {ev.participants}</div>
                    <div style={{ fontWeight: 600, marginTop: 8 }}>{ev.price}</div>
                    <Button type="primary" style={{ marginTop: 12 }}>Подробнее</Button>
                  </Card>
                </Col>
              ))}
            </Row>
          ) },
          { key: 'courses', label: <><BookOutlined /> Курсы</>, children: (
            <Row gutter={[24, 24]}>
              {courses.map(c => (
                <Col xs={24} sm={12} md={8} key={c.id}>
                  <Card style={{ borderRadius: 18, boxShadow: '0 2px 12px #e6eaf1', minHeight: 340 }}>
                    <div style={{ height: 120, background: '#f0f2f5', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="" alt="img" style={{ width: 60, height: 60, opacity: 0.2 }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 18 }}>{c.title} <Tag color="blue">{c.level}</Tag></div>
                    <div style={{ color: '#555', margin: '8px 0 12px 0' }}>{c.description}</div>
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>Длительность: {c.duration}</div>
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>Уроков: {c.lessons}</div>
                    <div style={{ fontWeight: 600, marginTop: 8 }}>{c.price}</div>
                    <Button type="primary" style={{ marginTop: 12 }}>Подробнее</Button>
                  </Card>
                </Col>
              ))}
            </Row>
          ) },
          { key: 'faq', label: <><QuestionCircleOutlined /> FAQ</>, children: (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <Title level={4} style={{ marginBottom: 16 }}>Часто задаваемые вопросы</Title>
              {tip}
              <Collapse accordion>
                {faq.map((f, i) => (
                  <Panel header={f.q} key={i}>
                    {f.a}
                  </Panel>
                ))}
              </Collapse>
            </div>
          ) },
        ]}
        style={{ background: 'transparent', marginBottom: 24 }}
      />
      <Button type="primary" style={{ float: 'right', marginBottom: 24 }}>Мои записи</Button>
    </div>
  );
} 