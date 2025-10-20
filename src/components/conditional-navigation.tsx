'use client';

import { useSession } from 'next-auth/react';
import { Navigation } from './navigation';
import { useEffect } from 'react';

export function ConditionalNavigation() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      if (session) {
        // Убираем отступ слева для полной ширины
        mainElement.style.marginLeft = '0';
        // Мобильная версия - отступ сверху
        mainElement.style.paddingTop = window.innerWidth < 1024 ? '4rem' : '0';
      } else {
        mainElement.style.marginLeft = '0';
        mainElement.style.paddingTop = '0';
      }
    }

    // Обработчик изменения размера окна
    const handleResize = () => {
      const mainElement = document.querySelector('main');
      if (mainElement && session) {
        mainElement.style.marginLeft = '0';
        mainElement.style.paddingTop = window.innerWidth < 1024 ? '4rem' : '0';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [session]);

  // Показываем навигацию только для авторизованных пользователей
  if (status === 'loading') {
    return null; // Не показываем навигацию во время загрузки
  }

  if (!session) {
    return null; // Не показываем навигацию для неавторизованных пользователей
  }

  return <Navigation />;
}