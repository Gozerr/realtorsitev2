import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS селектор для подсветки
  position: 'top' | 'bottom' | 'left' | 'right';
  sidebarItem?: string; // ключ пункта сайдбара для подсветки
}

export interface TutorialContextProps {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  startTutorial: () => void;
  stopTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextProps>({
  isActive: false,
  currentStep: 0,
  steps: [],
  startTutorial: () => {},
  stopTutorial: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTutorial: () => {},
});

export const useTutorial = () => useContext(TutorialContext);

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Добро пожаловать в CRM недвижимости! 🏠',
    description: 'Привет! Я проведу вас по основным возможностям системы. Нажимайте "Далее" или кликайте по затемненным областям, чтобы продолжить обучение. В любой момент можете пропустить обучение.',
    target: '.welcome-section',
    position: 'bottom'
  },
  {
    id: 'dashboard',
    title: 'Главная страница 📊',
    description: 'Это ваша главная панель управления. Здесь вы видите статистику по объектам, недавно добавленные объекты и быстрый доступ к основным функциям. Обратите внимание на подсвеченный пункт в левом меню.',
    target: '.dashboard-stats',
    position: 'bottom',
    sidebarItem: '/'
  },
  {
    id: 'properties',
    title: 'Объекты недвижимости 🏢',
    description: 'Здесь вы управляете всеми объектами недвижимости. Добавляйте новые, редактируйте существующие, отслеживайте статусы продаж. Посмотрите на подсвеченный пункт в сайдбаре.',
    target: '.sidebar-properties',
    position: 'right',
    sidebarItem: '/properties'
  },
  {
    id: 'clients',
    title: 'Мои клиенты 👥',
    description: 'Ведите базу клиентов, отслеживайте их предпочтения, историю взаимодействий и статус сделок. Обратите внимание на подсвеченный пункт меню.',
    target: '.sidebar-clients',
    position: 'right',
    sidebarItem: '/clients'
  },
  {
    id: 'selection',
    title: 'Подбор объектов 🔍',
    description: 'Автоматический подбор объектов под требования клиентов. Система анализирует предпочтения и предлагает лучшие варианты. Смотрите на подсвеченный пункт.',
    target: '.sidebar-selection',
    position: 'right',
    sidebarItem: '/selection'
  },
  {
    id: 'chats',
    title: 'Чаты 💬',
    description: 'Общайтесь с клиентами в реальном времени. Отвечайте на вопросы, отправляйте фото объектов, ведите переговоры. Обратите внимание на подсвеченный пункт.',
    target: '.sidebar-chats',
    position: 'right',
    sidebarItem: '/chats'
  },
  {
    id: 'notifications',
    title: 'Уведомления 🔔',
    description: 'Получайте уведомления о новых сообщениях, изменениях статусов объектов, важных событиях и сроках. Смотрите на подсвеченный пункт меню.',
    target: '.sidebar-notifications',
    position: 'right',
    sidebarItem: '/notifications'
  },
  {
    id: 'education',
    title: 'Обучение 📚',
    description: 'Доступ к обучающим материалам, курсам, вебинарам и FAQ. Развивайте профессиональные навыки. Обратите внимание на подсвеченный пункт.',
    target: '.sidebar-education',
    position: 'right',
    sidebarItem: '/education'
  },
  {
    id: 'profile',
    title: 'Мой профиль 👤',
    description: 'Управляйте личной информацией, настройками аккаунта, загружайте фото и настраивайте уведомления. Смотрите на подсвеченный пункт.',
    target: '.sidebar-profile',
    position: 'right',
    sidebarItem: '/profile'
  },
  {
    id: 'settings',
    title: 'Настройки ⚙️',
    description: 'Настройте систему под свои потребности: темы оформления, уведомления, интеграции и многое другое. Обратите внимание на подсвещенный пункт.',
    target: '.sidebar-settings',
    position: 'right',
    sidebarItem: '/settings'
  },
  {
    id: 'search',
    title: 'Поиск по сайту 🔎',
    description: 'Быстрый поиск по всем объектам, клиентам, чатам и материалам. Находите нужную информацию за секунды. Смотрите на подсвеченное поле поиска.',
    target: '.header-search',
    position: 'bottom'
  },
  {
    id: 'theme',
    title: 'Переключение темы 🌙',
    description: 'Переключайтесь между светлой и темной темой в зависимости от времени суток и ваших предпочтений. Обратите внимание на подсвеченную кнопку.',
    target: '.theme-toggle',
    position: 'left'
  },
  {
    id: 'finish',
    title: 'Обучение завершено! 🎉',
    description: 'Поздравляем! Вы познакомились с основными возможностями CRM. Теперь можете эффективно работать с системой. При необходимости можете повторить обучение в разделе FAQ.',
    target: '.welcome-section',
    position: 'bottom'
  }
];

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Проверяем, было ли уже показано обучение
    const hasSeenTutorial = localStorage.getItem('tutorial_completed');
    if (!hasSeenTutorial) {
      // Автоматически запускаем обучение при первом посещении
      setTimeout(() => {
        startTutorial();
      }, 2000); // Задержка 2 секунды
    }
  }, []);

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    document.body.style.overflow = 'hidden'; // Блокируем прокрутку
  };

  const stopTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
    document.body.style.overflow = ''; // Восстанавливаем прокрутку
    localStorage.setItem('tutorial_completed', 'true');
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      stopTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    stopTutorial();
  };

  return (
    <TutorialContext.Provider value={{
      isActive,
      currentStep,
      steps: tutorialSteps,
      startTutorial,
      stopTutorial,
      nextStep,
      prevStep,
      skipTutorial,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}; 