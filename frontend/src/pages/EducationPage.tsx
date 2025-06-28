import React, { useState, useEffect } from 'react';
import { Tabs, Card, Button, Row, Col, Typography, Tag, Collapse, Alert } from 'antd';
import { CalendarOutlined, BookOutlined, QuestionCircleOutlined, ClockCircleOutlined, EnvironmentOutlined, TeamOutlined, PlayCircleOutlined } from '@ant-design/icons';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useTutorial } from '../context/TutorialContext';
import { fetchEducationEvents, EducationEvent } from '../services/education.service';
import { createCalendarEvent, fetchCalendarEvents } from '../services/calendar.service';
import { createNotification } from '../services/notification.service';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Panel } = Collapse;

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

export type FaqType = typeof faq[number];

// mock-пользователь
const user = { name: 'Иван Иванов', isFamousRealtor: true };

export default function EducationPage() {
  const [tab, setTab] = useState('events');
  const [joyrideRun, setJoyrideRun] = useState(false);
  const { startTutorial } = useTutorial();
  const [educationEvents, setEducationEvents] = useState<EducationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchEducationEvents();
        console.log('educationEvents:', data); // Лог для диагностики
        setEducationEvents(data);
      } catch (e: any) {
        setError('Ошибка загрузки мероприятий. Попробуйте позже.');
        setEducationEvents([]);
        console.error('Ошибка загрузки:', e);
      }
      setLoading(false);
      timer = setTimeout(fetchData, 300000); // 5 минут
    };
    fetchData();
    return () => clearTimeout(timer);
  }, []);

  const events = educationEvents.filter(ev => ev.type === 'event' || ev.type === 'webinar');
  const courses = educationEvents.filter(ev => ev.type === 'course');

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
    <Card style={{ 
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(102, 126, 234, 0.1) 100%)', 
      border: '1px solid rgba(102, 126, 234, 0.2)', 
      marginBottom: 16,
      borderRadius: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <PlayCircleOutlined style={{ fontSize: '20px', color: 'var(--primary-color)' }} />
        <b style={{ color: 'var(--text-primary)' }}>Интерактивное обучение</b>
      </div>
      <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        Пройдите интерактивное обучение по работе с платформой. Система проведет вас по основным разделам, 
        подсветит важные элементы и объяснит их функциональность.
      </div>
      <Button 
        type="primary" 
        icon={<PlayCircleOutlined />}
        onClick={startTutorial}
        style={{ 
          background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
          border: 'none',
          fontWeight: '600',
          height: '40px'
        }}
      >
        Запустить обучение
      </Button>
    </Card>
  );

  useEffect(() => {
    async function syncCalendarAndNotify() {
      try {
        const calendarEvents = await fetchCalendarEvents();
        const allItems = educationEvents.map(ev => {
          let end = undefined;
          if (ev.endDate) {
            const endDateObj = new Date(ev.endDate);
            if (endDateObj.getHours() === 0 && endDateObj.getMinutes() === 0 && endDateObj.getSeconds() === 0) {
              endDateObj.setHours(23, 59, 59, 999);
            }
            end = endDateObj.toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
          }
          return {
            title: ev.title,
            description: ev.description,
            start: ev.date ? new Date(ev.date).toISOString().slice(0, 19) : '', // YYYY-MM-DDTHH:mm:ss
            end,
            type: 'public' as 'public',
          };
        });
        for (const item of allItems) {
          const exists = calendarEvents.some(e =>
            e.title === item.title &&
            e.type === item.type &&
            dayjs(e.start).format('YYYY-MM-DDTHH:mm:ss') === item.start &&
            (item.end ? dayjs(e.end).format('YYYY-MM-DDTHH:mm:ss') === item.end : !e.end)
          );
          if (!exists) {
            await createCalendarEvent(item);
          }
        }
        const updatedEvents = await fetchCalendarEvents();
        const now = new Date();
        const upcoming = allItems
          .map(i => ({ ...i, date: new Date(i.start) }))
          .filter(i => i.date > now)
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        if (upcoming.length > 0) {
          await createNotification({
            userId: 0,
            title: 'Ближайшее мероприятие',
            description: `${upcoming[0].title} — ${upcoming[0].start}`,
            type: 'calendar',
          });
        }
      } catch (e) {
        // ignore
      }
    }
    if (educationEvents.length > 0) {
      syncCalendarAndNotify();
    }
  }, [educationEvents]);

  const handleManualRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEducationEvents();
      console.log('educationEvents:', data); // Лог для диагностики
      setEducationEvents(data);
    } catch (e: any) {
      setError('Ошибка загрузки мероприятий. Попробуйте позже.');
      setEducationEvents([]);
      console.error('Ошибка загрузки:', e);
    }
    setLoading(false);
  };

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
      <Button type="default" onClick={handleManualRefresh} style={{ marginBottom: 24, marginRight: 16 }}>
        Обновить
      </Button>
      {error && <Alert type="error" message={error} style={{ marginBottom: 24 }} />}
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'events', label: <span data-tour="tab-events"><CalendarOutlined /> Мероприятия</span>, children: (
            <Row gutter={[24, 24]}>
              {loading ? <div>Загрузка...</div> :
                events.length === 0 ? <div style={{ padding: 32, width: '100%' }}>Нет мероприятий</div> :
                events.map((ev, idx) => (
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
                        <span>{ev.date ? new Date(ev.date).toLocaleString() : ''}</span>
                        {ev.endDate && typeof ev.endDate === 'string' && (
                          <span style={{ marginLeft: 8 }}>
                            — {new Date(ev.endDate).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {ev.place && (
                        <div style={{ display: 'flex', alignItems: 'center', color: '#888', fontSize: 15, marginBottom: 8 }}>
                          <EnvironmentOutlined style={{ marginRight: 6 }} />
                          <span>{ev.place}</span>
                        </div>
                      )}
                      {ev.link && (
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
                      )}
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
                {loading ? <div>Загрузка...</div> :
                  courses.length === 0 ? <div style={{ padding: 32, width: '100%' }}>Нет курсов</div> :
                  courses.map((c, idx) => (
                    <Col xs={24} sm={12} md={8} key={c.title + idx}>
                      <Card style={{ borderRadius: 18, boxShadow: '0 2px 12px #e6eaf1', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: 18 }}>
                          <div style={{ color: '#888', fontSize: 15, marginBottom: 6 }}>{c.date ? new Date(c.date).toLocaleString() : ''}</div>
                          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{c.title}</div>
                          <div style={{ color: '#555', marginBottom: 14, minHeight: 44 }}>{c.description}</div>
                          {c.place && (
                            <div style={{ color: '#888', fontSize: 15, marginBottom: 6 }}>{c.place}</div>
                          )}
                          {c.link && (
                            <Button type="primary" style={{ width: '100%' }} href={c.link} target="_blank" rel="noopener noreferrer">Подробнее</Button>
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