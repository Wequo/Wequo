import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
const sectorId = 'TransportationForm'; 

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'es', 
    fallbackLng: 'es',
    ns: ['form'], 
    defaultNS: 'form',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: `/locales/${sectorId}/{{lng}}/{{ns}}.json`, 
    },
  });

export default i18n;