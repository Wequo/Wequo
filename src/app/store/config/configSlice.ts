import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ConfigState } from './types';
import { fetchFormDetails, fetchCompanyConfig } from './fetchData';
import { RootState } from '@/app/store';

const initialState: ConfigState = {
  sector_id: 0,
  form_id: '',
  language: 'en',
  showPrices: false,
  isDialog: false,
  schemes: {
    background_color: '#FFFFFF',
    text_color: '#000000',
    btn_color: "#fff",
    btn_background:"#2563eb"
  },
};

export const fetchConfig = createAsyncThunk(
  'config/fetchConfig',
  async (
    { formId, isDialog = false}: 
    { formId: string, isDialog?: boolean}, 
    { rejectWithValue }
  ) => {
    try {
      const formResult = await fetchFormDetails(formId);
      if (formResult.company_id) {
        const configResult = await fetchCompanyConfig(formResult.company_id);
        if (configResult.success) {
          return { 
            ...configResult, 
            form_id: formId, 
            sector_id: formResult.sector_id,
            language: formResult.language,
            showPrices:formResult.show_prices,
            isDialog,
          };
        }
      }
      return rejectWithValue('Error: No company_id found in form response');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);



const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    resetConfig: () => initialState,
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchConfig.fulfilled, (state: ConfigState, action: PayloadAction<ConfigState>) => {
      return { ...state, ...action.payload };
    });
  },
});

export const { setLanguage, resetConfig } = configSlice.actions;

// Selector con el tipo RootState aplicado
export const selectConfig = (state: RootState) => state.config;

export default configSlice.reducer;
