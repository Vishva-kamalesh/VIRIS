import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import violationsReducer from '../features/violations/violationsSlice';
import themeReducer from '../features/theme/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    violations: violationsReducer,
    theme: themeReducer,
  },
});
