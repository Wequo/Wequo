import React, {useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from '@/app/store';
import { updateFormData } from '@/app/store/transportation/formSlice';
import { useTranslation } from 'next-i18next';


const Step3 = () => {
  const { t } = useTranslation('form'); 

  const dispatch = useDispatch();
  const formData = useSelector((state: RootState) => state.formData);
  const [isEmailValid, setIsEmailValid] = useState(true);
  console.log(formData);
  
  const handleChange = (field: keyof typeof formData, value: any) => {
    dispatch(updateFormData({ [field]: value }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    handleChange("email", value);
    setIsEmailValid(validateEmail(value));
  };

  return (
    <>

      <div className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">{t('step3.email')}*</label>
            <input
              type="email"
              placeholder={"john@doe.com"}
              value={formData.email}
              required
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`w-full border rounded-lg p-2 focus:border-blue-500 ${
                isEmailValid ? 'border-gray-400' : 'border-red-500'
              }`}
            />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">{t('step3.phone')}</label>
          <input
            type="tel"
            placeholder="(+34) 123456789"
            value={formData.phoneNumber}
            required
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
            className="w-full border border-gray-400 rounded-lg p-2 focus:border-blue-500"
          />
        </div>
      </div>

 
    </>
  );
};

export default Step3;