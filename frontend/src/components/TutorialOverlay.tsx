import React, { useEffect, useRef } from 'react';
import { Button, Progress } from 'antd';
import { CloseOutlined, LeftOutlined, RightOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useTutorial } from '../context/TutorialContext';

const TutorialOverlay: React.FC = () => {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTutorial } = useTutorial();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const currentStepData = steps[currentStep];
    if (!currentStepData) return;

    // Находим целевой элемент
    const targetElement = document.querySelector(currentStepData.target);
    if (!targetElement) return;

    // Специальная анимация для первого шага
    if (currentStep === 0) {
      // Добавляем пульсирующую анимацию к welcome section
      targetElement.classList.add('tutorial-welcome-pulse');
    }

    // Подсвечиваем элемент сайдбара если указан
    if (currentStepData.sidebarItem) {
      const sidebarItems = document.querySelectorAll('.ant-menu-item');
      sidebarItems.forEach(item => {
        item.classList.remove('tutorial-highlight');
      });
      
      // Ищем элемент сайдбара по data-menu-id или по тексту
      let targetSidebarItem = document.querySelector(`[data-menu-id="${currentStepData.sidebarItem}"]`);
      if (!targetSidebarItem) {
        // Если не найден по data-menu-id, ищем по тексту
        const menuItems = document.querySelectorAll('.ant-menu-item');
        menuItems.forEach(item => {
          const text = item.textContent?.toLowerCase();
          if (text) {
            if (currentStepData.sidebarItem === '/' && (text.includes('главная') || text.includes('dashboard'))) {
              targetSidebarItem = item;
            } else if (currentStepData.sidebarItem === '/properties' && (text.includes('объект') || text.includes('property'))) {
              targetSidebarItem = item;
            } else if (currentStepData.sidebarItem === '/clients' && (text.includes('клиент') || text.includes('client'))) {
              targetSidebarItem = item;
            } else if (currentStepData.sidebarItem === '/selection' && (text.includes('подбор') || text.includes('selection'))) {
              targetSidebarItem = item;
            } else if (currentStepData.sidebarItem === '/chats' && (text.includes('чат') || text.includes('chat'))) {
              targetSidebarItem = item;
            } else if (currentStepData.sidebarItem === '/notifications' && (text.includes('уведомлен') || text.includes('notification'))) {
              targetSidebarItem = item;
            } else if (currentStepData.sidebarItem === '/education' && (text.includes('обучен') || text.includes('education'))) {
              targetSidebarItem = item;
            } else if (currentStepData.sidebarItem === '/profile' && (text.includes('профиль') || text.includes('profile'))) {
              targetSidebarItem = item;
            } else if (currentStepData.sidebarItem === '/settings' && (text.includes('настройк') || text.includes('setting'))) {
              targetSidebarItem = item;
            }
          }
        });
      }
      
      // Если все еще не найден, попробуем найти по индексу
      if (!targetSidebarItem) {
        const menuItems = Array.from(document.querySelectorAll('.ant-menu-item'));
        const sidebarItemIndex: Record<string, number> = {
          '/': 0,
          '/properties': 1,
          '/clients': 2,
          '/selection': 3,
          '/chats': 4,
          '/notifications': 5,
          '/education': 6,
          '/profile': 7,
          '/settings': 8
        };
        
        const index = sidebarItemIndex[currentStepData.sidebarItem];
        if (index !== undefined && menuItems[index]) {
          targetSidebarItem = menuItems[index];
        }
      }
      
      if (targetSidebarItem) {
        targetSidebarItem.classList.add('tutorial-highlight');
        
        // Прокручиваем к элементу если он не виден
        targetSidebarItem.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }

    // Позиционируем оверлей
    const rect = targetElement.getBoundingClientRect();
    const overlay = overlayRef.current;
    if (!overlay) return;

    const overlayRect = overlay.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const GAP = 24; // Отступ между оверлеем и целевым блоком

    let left = rect.left + rect.width / 2 - overlayRect.width / 2;
    let top = rect.bottom + GAP; // По умолчанию снизу
    let positionUsed = currentStepData.position;

    // Автоматический выбор позиции, если явно не указано
    if (currentStepData.position === 'bottom' || currentStepData.position === 'top') {
      // Проверяем, хватает ли места снизу
      if (rect.bottom + GAP + overlayRect.height > windowHeight - 20) {
        // Места снизу мало — пробуем сверху
        if (rect.top - GAP - overlayRect.height > 20) {
          top = rect.top - overlayRect.height - GAP;
          positionUsed = 'top';
        } else {
          // Места и сверху мало — пробуем справа
          if (rect.right + GAP + overlayRect.width < windowWidth - 20) {
            left = rect.right + GAP;
            top = rect.top + rect.height / 2 - overlayRect.height / 2;
            positionUsed = 'right';
          } else if (rect.left - GAP - overlayRect.width > 20) {
            // Пробуем слева
            left = rect.left - overlayRect.width - GAP;
            top = rect.top + rect.height / 2 - overlayRect.height / 2;
            positionUsed = 'left';
          } else {
            // Если не удалось разместить сбоку, ставим по центру экрана (но не меняем positionUsed)
            if (rect.bottom + GAP + overlayRect.height > windowHeight - 20 &&
                rect.top - GAP - overlayRect.height <= 20 &&
                rect.right + GAP + overlayRect.width >= windowWidth - 20 &&
                rect.left - GAP - overlayRect.width <= 20) {
              left = windowWidth / 2 - overlayRect.width / 2;
              top = windowHeight / 2 - overlayRect.height / 2;
              // positionUsed = 'center'; // не присваиваем, чтобы не было ошибки типов
            }
          }
        }
      }
    } else if (currentStepData.position === 'right') {
      // Если справа мало места — пробуем слева
      if (rect.right + GAP + overlayRect.width > windowWidth - 20) {
        if (rect.left - GAP - overlayRect.width > 20) {
          left = rect.left - overlayRect.width - GAP;
          top = rect.top + rect.height / 2 - overlayRect.height / 2;
          positionUsed = 'left';
        }
      }
    } else if (currentStepData.position === 'left') {
      // Если слева мало места — пробуем справа
      if (rect.left - GAP - overlayRect.width < 20) {
        if (rect.right + GAP + overlayRect.width < windowWidth - 20) {
          left = rect.right + GAP;
          top = rect.top + rect.height / 2 - overlayRect.height / 2;
          positionUsed = 'right';
        }
      }
    }

    // Проверяем границы экрана
    if (left < 20) left = 20;
    if (left + overlayRect.width > windowWidth - 20) left = windowWidth - overlayRect.width - 20;
    if (top < 20) top = 20;
    if (top + overlayRect.height > windowHeight - 20) top = windowHeight - overlayRect.height - 20;

    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;

    // Добавляем подсветку к целевому элементу
    targetElement.classList.add('tutorial-target');

    return () => {
      targetElement.classList.remove('tutorial-target');
      targetElement.classList.remove('tutorial-welcome-pulse');
      if (currentStepData.sidebarItem) {
        const sidebarItems = document.querySelectorAll('.ant-menu-item');
        sidebarItems.forEach(item => {
          item.classList.remove('tutorial-highlight');
        });
      }
    };
  }, [isActive, currentStep, steps]);

  if (!isActive) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Затемненный фон */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9998,
          cursor: 'pointer'
        }}
        onClick={nextStep}
      />
      
      {/* Оверлей с информацией */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          zIndex: 9999,
          background: 'var(--card-background)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), 0 10px 20px rgba(0, 0, 0, 0.2)',
          border: '2px solid var(--primary-color)',
          maxWidth: '450px',
          minWidth: '350px',
          backdropFilter: 'blur(15px)',
          animation: 'fadeInUp 0.4s ease'
        }}
      >
        {/* Заголовок */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          marginBottom: '20px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}>
              <PlayCircleOutlined style={{ 
                fontSize: '20px', 
                color: 'white' 
              }} />
            </div>
            <h3 style={{ 
              margin: 0, 
              color: 'var(--text-primary)',
              fontSize: '20px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {currentStepData.title}
            </h3>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={skipTutorial}
            style={{ 
              color: 'var(--text-secondary)',
              padding: '8px',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </div>

        {/* Описание */}
        <p style={{ 
          color: 'var(--text-secondary)', 
          marginBottom: '24px',
          lineHeight: '1.7',
          fontSize: '15px',
          fontWeight: '400'
        }}>
          {currentStepData.description}
        </p>

        {/* Прогресс */}
        <div style={{ marginBottom: '24px' }}>
          <Progress 
            percent={progress} 
            size="small" 
            strokeColor={{
              '0%': 'var(--primary-color)',
              '100%': 'var(--secondary-color)',
            }}
            showInfo={false}
            strokeWidth={8}
            trailColor="var(--border-light)"
          />
          <div style={{ 
            textAlign: 'center', 
            fontSize: '13px', 
            color: 'var(--text-muted)',
            marginTop: '8px',
            fontWeight: '500'
          }}>
            Шаг {currentStep + 1} из {steps.length}
          </div>
        </div>

        {/* Кнопки навигации */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '12px'
        }}>
          <Button
            type="default"
            icon={<LeftOutlined />}
            onClick={prevStep}
            disabled={currentStep === 0}
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              height: '44px',
              borderRadius: '12px',
              fontWeight: '600'
            }}
          >
            Назад
          </Button>
          
          <Button
            type="primary"
            onClick={nextStep}
            style={{
              background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
              border: 'none',
              height: '44px',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '15px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            {currentStep === steps.length - 1 ? 'Завершить обучение' : 'Далее'}
          </Button>
        </div>
      </div>
    </>
  );
};

export default TutorialOverlay; 