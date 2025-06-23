import React, { useState, useEffect } from 'react';
import { Tabs, Card, Button, Row, Col, Typography, Tag, Collapse } from 'antd';
import { CalendarOutlined, BookOutlined, QuestionCircleOutlined, ClockCircleOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

const { Title } = Typography;
const { Panel } = Collapse;

export const events = [
  { id: 1, title: 'Основы работы с клиентами', type: 'Семинар', description: 'Базовый курс по работе с клиентами...', date: '15.06.2023', time: '10:00 - 13:00', place: 'Офис компании', participants: '12 из 20', price: 'Бесплатно' },
  { id: 2, title: 'Юридические аспекты сделок', type: 'Мастер-класс', description: 'Курс по правовым аспектам...', date: '20.06.2023', time: '14:00 - 18:00', place: 'Бизнес-центр', participants: '8 из 15', price: '2 500 ₽' },
];
export const courses = [
  { id: 1, title: 'Базовый курс риэлтора', level: 'Начинающий', description: 'Комплексный курс для начинающих...', duration: '4 недели', lessons: 12, price: '15 000 ₽' },
  { id: 2, title: 'Продвинутые техники продаж', level: 'Продвинутый', description: 'Курс для опытных риэлторов...', duration: '3 недели', lessons: 9, price: '20 000 ₽' },
];
export const faq = [
  { q: 'Как добавить новый объект?', a: 'Перейдите в раздел "Объекты недвижимости" и нажмите "Добавить объект".' },
  { q: 'Как изменить статус объекта?', a: 'В карточке объекта выберите нужный статус.' },
];

const joyrideSteps: Step[] = [
  {
    target: '[data-tour="tab-events"]',
    title: 'Мероприятия',
    content: 'Здесь вы найдете все предстоящие и прошедшие мероприятия для риэлторов.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="tab-courses"]',
    title: 'Курсы',
    content: 'В этом разделе собраны обучающие курсы для повышения квалификации.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="tab-faq"]',
    title: 'FAQ',
    content: 'Часто задаваемые вопросы и советы по работе с платформой.',
    disableBeacon: true,
    placement: 'bottom',
  },
];

export type EventType = typeof events[number];
export type CourseType = typeof courses[number];
export type FaqType = typeof faq[number];

export default function EducationPage() {
  const [tab, setTab] = useState('events');
  const [joyrideRun, setJoyrideRun] = useState(false);

  // Автоматический запуск walkthrough для новых пользователей
  useEffect(() => {
    if (!localStorage.getItem('walkthrough_shown')) {
      setTimeout(() => {
        setJoyrideRun(true);
        localStorage.setItem('walkthrough_shown', '1');
      }, 800);
    }
  }, []);

  // Обработка завершения walkthrough
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, step } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setJoyrideRun(false);
    }
    // Переключаем вкладку по шагу
    if (step && step.target && typeof step.target === 'string') {
      if (step.target.includes('tab-events')) setTab('events');
      if (step.target.includes('tab-courses')) setTab('courses');
      if (step.target.includes('tab-faq')) setTab('faq');
    }
  };

  const tip = (
    <Card style={{ background: '#f5faff', border: '1px solid #b3e5fc', marginBottom: 16 }}>
      <b>💡 Совет</b>
      <div style={{ marginTop: 8 }}>
        Вы можете запустить интерактивное обучение по работе с платформой, нажав на кнопку ниже. Система проведет вас по основным разделам и объяснит их функциональность.
      </div>
      <Button type="primary" style={{ marginTop: 12 }} onClick={() => setJoyrideRun(true)}>
        Запустить обучение
      </Button>
    </Card>
  );

  return (
    <div style={{ width: '100%', padding: '32px 40px 0 40px', background: 'var(--edu-bg, #f7f9fb)', minHeight: '100vh' }}>
      <Joyride
        steps={joyrideSteps}
        run={joyrideRun}
        continuous
        showSkipButton
        showProgress
        locale={{ back: 'Назад', close: 'Закрыть', last: 'Готово', next: 'Далее', skip: 'Пропустить обучение' }}
        styles={{
          options: {
            zIndex: 11000,
            primaryColor: '#296fff',
            textColor: '#222',
            arrowColor: '#fff',
          },
        }}
        callback={handleJoyrideCallback}
      />
      <h1 style={{ marginBottom: 24 }}>Обучение</h1>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'events', label: <span data-tour="tab-events"><CalendarOutlined /> Мероприятия</span>, children: (
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
          { key: 'courses', label: <span data-tour="tab-courses"><BookOutlined /> Курсы</span>, children: (
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
          { key: 'faq', label: <span data-tour="tab-faq"><QuestionCircleOutlined /> FAQ</span>, children: (
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