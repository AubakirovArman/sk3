import { homeTranslations } from './home';
import { navigationTranslations } from './navigation';
import { virtualDirectorTranslations } from './virtual-director';
import { chatTranslations } from './chat';
import { authTranslations } from './auth';
import { dialogTranslations } from './dialog';

export const translations = {
  ru: {
    home: homeTranslations.ru,
    navigation: navigationTranslations.ru,
    virtualDirector: virtualDirectorTranslations.ru,
    chat: chatTranslations.ru,
    auth: authTranslations.ru,
    dialog: dialogTranslations.ru
  },
  kk: {
    home: homeTranslations.kk,
    navigation: navigationTranslations.kk,
    virtualDirector: virtualDirectorTranslations.kk,
    chat: chatTranslations.kk,
    auth: authTranslations.kk,
    dialog: dialogTranslations.kk
  },
  en: {
    home: homeTranslations.en,
    navigation: navigationTranslations.en,
    virtualDirector: virtualDirectorTranslations.en,
    chat: chatTranslations.en,
    auth: authTranslations.en,
    dialog: dialogTranslations.en
  }
};

export type Language = 'ru' | 'kk' | 'en';
export type Translations = typeof translations;