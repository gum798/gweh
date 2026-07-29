import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { BRAND } from './lib/brand';

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

// html[lang] 도 여기서 맞춘다. 지금까지 이 속성을 쓰는 곳은 AppHeader 의 토글
// 하나뿐이었고, 그래서 index.html 에 박힌 "ko" 가 새로고침마다 되살아났다.
// 결과적으로 src/index.css 의 `html[lang="en"] { font-size: 17px }` — 영문
// 광학 보정 — 이 **토글 직후에만** 적용되고 재방문에는 적용되지 않았다.
// 두 렌더가 39px(히어로 기준) 차이 나므로 레이아웃 검증이 매번 다른 답을 준다.
// 진짜 최악은 사용자가 토글한 뒤의 상태이고, 그쪽을 기본으로 삼아야 맞다.
document.documentElement.lang = savedLanguage;

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
    // 브랜드명은 번역 대상이 아니라 상수다. 로케일 파일에 'GWEH AI' 를 적어
    // 두면 ko/en 두 곳(앞으로 언어가 늘면 더)에 같은 리터럴이 흩어지고,
    // 이번 작업이 정리한 상태로 정확히 되돌아간다. defaultVariables 로 넣어
    // 두면 어느 키에서든 {{brand}} 가 호출부 인자 없이 채워진다 —
    // t('sub.description') 처럼 이미 있는 호출을 건드리지 않아도 된다.
    defaultVariables: { brand: BRAND },
  },
});

export default i18n;
