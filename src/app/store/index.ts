import { configureStore } from '@reduxjs/toolkit';
import configReducer from './config/configSlice';
import formDataReducer from './transportation/formSlice';

const store = configureStore({
  reducer: {
    formData: formDataReducer,
    config: configReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;