import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import koCommon from './locales/ko/common.json';
import koOmen from './locales/ko/omen.json';
import koFace from './locales/ko/face.json';
import koPalm from './locales/ko/palm.json';
import koSaju from './locales/ko/saju.json';
import koFashion from './locales/ko/fashion.json';
import koAuth from './locales/ko/auth.json';

import enCommon from './locales/en/common.json';
import enOmen from './locales/en/omen.json';
import enFace from './locales/en/face.json';
import enPalm from './locales/en/palm.json';
import enSaju from './locales/en/saju.json';
import enFashion from './locales/en/fashion.json';
import enAuth from './locales/en/auth.json';

const savedLanguage = localStorage.getItem('mystic_language') || 'ko';

i18n.use(initReactI18next).init({
  resources: {
    ko: {
      common: koCommon,
      omen: koOmen,
      face: koFace,
      palm: koPalm,
      saju: koSaju,
      fashion: koFashion,
      auth: koAuth,
    },
    en: {
      common: enCommon,
      omen: enOmen,
      face: enFace,
      palm: enPalm,
      saju: enSaju,
      fashion: enFashion,
      auth: enAuth,
    },
  },
  lng: savedLanguage,
  fallbackLng: 'ko',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
