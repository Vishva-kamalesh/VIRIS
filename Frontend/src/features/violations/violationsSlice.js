import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getViolationsAPI, getMonthlyStatsAPI, searchViolationsAPI } from '../../services/api';

export const fetchViolations = createAsyncThunk('violations/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await getViolationsAPI();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to fetch violations');
  }
});

export const fetchMonthlyStats = createAsyncThunk('violations/fetchMonthly', async (_, { rejectWithValue }) => {
  try {
    const res = await getMonthlyStatsAPI();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to fetch stats');
  }
});

export const searchViolations = createAsyncThunk('violations/search', async (vehicleNumber, { rejectWithValue }) => {
  try {
    const res = await searchViolationsAPI(vehicleNumber);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Search failed');
  }
});

const violationsSlice = createSlice({
  name: 'violations',
  initialState: {
    list: [],
    monthly: [],
    searchResults: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearSearch(state) {
      state.searchResults = [];
    },
    addViolation(state, action) {
      state.list.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchViolations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchViolations.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchViolations.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchMonthlyStats.fulfilled, (state, action) => { state.monthly = action.payload; })

      .addCase(searchViolations.pending, (state) => { state.loading = true; })
      .addCase(searchViolations.fulfilled, (state, action) => { state.loading = false; state.searchResults = action.payload; })
      .addCase(searchViolations.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearSearch, addViolation } = violationsSlice.actions;
export default violationsSlice.reducer;
