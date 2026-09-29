import { createSlice } from '@reduxjs/toolkit';

/**
 * Cross-feature activity signal.
 *
 * Group 8 actions that can produce a server-side notification (register,
 * cancel registration, publish announcement, submit feedback, ...) bump this
 * counter. Features that must stay in sync - such as the notification inbox -
 * watch it and refresh, instead of each page knowing about every other page.
 */
export interface ActivityState {
  revision: number;
  lastActivityAt: string | null;
}

const initialState: ActivityState = {
  revision: 0,
  lastActivityAt: null,
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    userActivityRecorded(state) {
      state.revision += 1;
      state.lastActivityAt = new Date().toISOString();
    },
  },
});

export const { userActivityRecorded } = activitySlice.actions;
export const activityReducer = activitySlice.reducer;
