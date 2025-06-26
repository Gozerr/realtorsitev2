import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Modal, Button, Form, Input, Select, DatePicker, Tag, Tooltip, Space } from 'antd';
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, CalendarEvent } from '../services/calendar.service';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { message } from 'antd';

const eventColors = {
  personal: '#1976d2',
  public: '#ff9800',
};

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const data = await fetchCalendarEvents();
    setEvents(data);
    setLoading(false);
  };

  const handleDateSelect = (selectInfo: any) => {
    setEditingEvent(null);
    setModalOpen(true);
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        start: dayjs(selectInfo.startStr),
        end: dayjs(selectInfo.endStr),
        type: 'personal',
      });
    }, 0);
  };

  const handleEventClick = (clickInfo: any) => {
    const event = events.find(e => e.id === Number(clickInfo.event.id));
    if (event) {
      setEditingEvent(event);
      form.setFieldsValue({
        ...event,
        start: dayjs(event.start),
        end: event.end ? dayjs(event.end) : undefined,
      });
      setModalOpen(true);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('values', values);
      const payload = {
        ...values,
        start: values.start.format('YYYY-MM-DDTHH:mm:ss'),
        end: values.end ? values.end.format('YYYY-MM-DDTHH:mm:ss') : undefined,
        type: values.type || 'personal',
      };
      console.log('payload', payload);
      if (editingEvent) {
        await updateCalendarEvent(editingEvent.id, payload);
      } else {
        await createCalendarEvent(payload);
      }
      setModalOpen(false);
      form.resetFields();
      loadEvents();
    } catch (err) {
      // Показываем подробное сообщение об ошибке
      // @ts-ignore
      message.error(err?.response?.data?.message || err.message || 'Ошибка');
    }
  };

  const handleDelete = async () => {
    if (editingEvent) {
      try {
        await deleteCalendarEvent(editingEvent.id);
        setModalOpen(false);
        form.resetFields();
        loadEvents();
      } catch (err) {
        // Показываем подробное сообщение об ошибке
        // @ts-ignore
        message.error(err?.response?.data?.message || err.message || 'Ошибка');
      }
    }
  };

  return (
    <div style={{ padding: 32, background: 'var(--background-color)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Space>
          <CalendarOutlined style={{ fontSize: 32, color: '#1976d2' }} />
          <span style={{ fontSize: 28, fontWeight: 700 }}>Календарь событий</span>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => {
          setEditingEvent(null);
          setModalOpen(true);
          setTimeout(() => {
            form.resetFields();
          }, 0);
        }}>
          Добавить событие
        </Button>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        events={events.map(e => ({
          id: e.id.toString(),
          title: e.title,
          start: e.start,
          end: e.end,
          backgroundColor: eventColors[e.type],
          borderColor: eventColors[e.type],
          extendedProps: e,
        }))}
        selectable
        select={handleDateSelect}
        eventClick={handleEventClick}
        height="auto"
        eventContent={renderEventContent}
        locale="ru"
      />
      <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleModalOk}
        title={editingEvent ? 'Редактировать событие' : 'Новое событие'}
        okText={editingEvent ? 'Сохранить' : 'Создать'}
        footer={[
          editingEvent && <Button key="delete" danger icon={<DeleteOutlined />} onClick={handleDelete}>Удалить</Button>,
          <Button key="cancel" onClick={() => { setModalOpen(false); form.resetFields(); }}>Отмена</Button>,
          <Button key="ok" type="primary" onClick={handleModalOk}>{editingEvent ? 'Сохранить' : 'Создать'}</Button>,
        ]}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}><Input placeholder="Название события" /></Form.Item>
          <Form.Item name="description" label="Описание"><Input.TextArea placeholder="Описание события" autoSize /></Form.Item>
          <Form.Item name="type" label="Тип" rules={[{ required: true }]}><Select><Select.Option value="personal">Личное</Select.Option><Select.Option value="public">Общее</Select.Option></Select></Form.Item>
          <Form.Item name="start" label="Начало" rules={[{ required: true, message: 'Укажите дату и время' }]}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="end" label="Окончание"><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
      <div style={{ marginTop: 32 }}>
        <Tag color={eventColors.personal} style={{ fontSize: 16, padding: '4px 12px' }}>Личное событие</Tag>
        <Tag color={eventColors.public} style={{ fontSize: 16, padding: '4px 12px', marginLeft: 12 }}>Общее мероприятие</Tag>
      </div>
    </div>
  );
};

function renderEventContent(eventInfo: any) {
  const { event } = eventInfo;
  const type = event.extendedProps.type as 'personal' | 'public';
  return (
    <Tooltip title={<div>
      <div style={{ fontWeight: 600 }}>{event.title}</div>
      {event.extendedProps.description && <div style={{ marginTop: 4 }}>{event.extendedProps.description}</div>}
      <div style={{ marginTop: 8, color: '#888' }}>{type === 'personal' ? 'Личное событие' : 'Общее мероприятие'}</div>
    </div>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Tag color={eventColors[type]} style={{ marginRight: 0 }} />
        <span style={{ fontWeight: 500 }}>{event.title}</span>
      </div>
    </Tooltip>
  );
}

export default CalendarPage; 