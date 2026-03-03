import { createSlice } from '@reduxjs/toolkit';

const savedTheme = localStorage.getItem('viris_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: savedTheme },
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', state.mode);
      localStorage.setItem('viris_theme', state.mode);
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
