import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { setLanguage } from '@/app/store/config/configSlice';
import i18n from '@/i18n';
import { useTranslation } from 'next-i18next';

const LanguageSelector = () => {
  const { t } = useTranslation('form'); 

  const dispatch = useDispatch();
  const language = useSelector((state: RootState) => state.config.language);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLanguage = event.target.value;
    dispatch(setLanguage(selectedLanguage)); 
    i18n.changeLanguage(selectedLanguage); 
  };

  return (
    <div className=" rounded-lg p-2 m-2 ">
      <select
        value={language}
        onChange={handleLanguageChange}
        className=" bg-transparent p-2 border border-gray-300 rounded-lg text-xs ml-auto"
      >
        <option value="es">{t('languages.es')}</option>
        <option value="en">{t('languages.en')}</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
