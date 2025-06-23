import React, { useState, useEffect } from 'react';
import { Tabs, Card, Button, Row, Col, Typography, Tag, Collapse } from 'antd';
import { CalendarOutlined, BookOutlined, QuestionCircleOutlined, ClockCircleOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import realEvents from '../data/real_events.json';
import realCourses from '../data/real_courses.json';

const { Title } = Typography;
const { Panel } = Collapse;

export const events = realEvents;
export type CourseType = {
  title: string;
  description: string;
  dateTime?: string;
  img?: string;
  rating?: string;
  price?: string;
  duration?: string;
  link?: string;
};

export const courses: CourseType[] = realCourses;
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
export type FaqType = typeof faq[number];

// mock-пользователь
const user = { name: 'Иван Иванов', isFamousRealtor: true };

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
              {events.map((ev, idx) => (
                <Col xs={24} sm={12} md={8} key={ev.title + idx}>
                  <Card
                    style={{
                      borderRadius: 22,
                      boxShadow: '0 4px 24px #e6eaf1',
                      minHeight: 420,
                      background: '#fff',
                      padding: 0,
                      overflow: 'hidden',
                      transition: 'box-shadow 0.2s',
                      marginBottom: 8,
                    }}
                    bodyStyle={{ padding: 20, paddingTop: 16 }}
                    hoverable
                  >
                    <div style={{
                      width: '100%',
                      height: 110,
                      background: '#f0f2f5',
                      borderTopLeftRadius: 22,
                      borderTopRightRadius: 22,
                      margin: '-20px -20px 16px -20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {ev.img ? (
                        <img src={ev.img} alt={ev.title} style={{ width: '80%', height: '90%', objectFit: 'contain' }} />
                      ) : (
                        <img src="" alt="img" style={{ width: 60, height: 60, opacity: 0.2 }} />
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>{ev.title}</div>
                    <div style={{ color: '#555', marginBottom: 14, minHeight: 44 }}>{ev.description}</div>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#888', fontSize: 15, marginBottom: 4 }}>
                      <ClockCircleOutlined style={{ marginRight: 6 }} />
                      <span>{ev.dateText}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#888', fontSize: 15, marginBottom: 8 }}>
                      <EnvironmentOutlined style={{ marginRight: 6 }} />
                      <span>{ev.place}</span>
                    </div>
                    <div style={{ color: '#888', fontSize: 14, marginBottom: 12 }}>
                      {ev.startDate && ev.endDate && (
                        <span>С {ev.startDate} по {ev.endDate}</span>
                      )}
                    </div>
                    <Button
                      type="primary"
                      style={{ width: '100%', fontWeight: 600, fontSize: 16, height: 44, marginTop: 8 }}
                      href={ev.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon={<CalendarOutlined />}
                    >
                      Подробнее
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          ) },
          { key: 'courses', label: <span data-tour="tab-courses"><BookOutlined /> Курсы</span>, children: (
            <>
              {user.isFamousRealtor && (
                <Button type="primary" style={{ marginBottom: 24 }}>
                  + Создать курс
                </Button>
              )}
              <Row gutter={[24, 24]}>
                {courses.map((c, idx) => (
                  <Col xs={24} sm={12} md={8} key={c.title + idx}>
                    <Card style={{ borderRadius: 18, boxShadow: '0 2px 12px #e6eaf1', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: 18 }}>
                        <div style={{ color: '#888', fontSize: 15, marginBottom: 6 }}>{c.dateTime}</div>
                        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{c.title}</div>
                        <div style={{ color: '#555', marginBottom: 14, minHeight: 44 }}>{c.description}</div>
                        {c.link && (
                          <Button type="primary" style={{ width: '100%' }} href={c.link} target="_blank" rel="noopener noreferrer">Смотреть запись вебинара</Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
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