import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/group8';
import type { AppNotification } from '@/types';

/**
 * In-app notification inbox (Group 8 communication-feedback-service).
 *
 * Kept in Redux because the header bell and the Notification Center both
 * read it, and actions elsewhere (register, cancel, publish) must refresh it.
 */
export interface NotificationsState {
  items: AppNotification[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isDemo: boolean;
  lastFetchedAt: string | null;
}

const initialState: NotificationsState = {
  items: [],
  status: 'idle',
  error: null,
  isDemo: false,
  lastFetchedAt: null,
};

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  const result = await getMyNotifications();
  if (!result.ok) return rejectWithValue(result.message);
  return { items: result.data, isDemo: result.demo };
});

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markRead',
  async (notificationId: string, { rejectWithValue }) => {
    const result = await markNotificationRead(notificationId);
    if (!result.ok) return rejectWithValue(result.message);
    return notificationId;
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    const result = await markAllNotificationsRead();
    if (!result.ok) return rejectWithValue(result.message);
    return true;
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notificationsCleared() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = [...action.payload.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        state.isDemo = action.payload.isDemo;
        state.lastFetchedAt = new Date().toISOString();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Could not load notifications.';
      })
      // Optimistic read-state updates, rolled back on failure.
      .addCase(markNotificationAsRead.pending, (state, action) => {
        const item = state.items.find((notification) => notification.id === action.meta.arg);
        if (item) item.read = true;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        const item = state.items.find((notification) => notification.id === action.meta.arg);
        if (item) item.read = false;
        state.error = (action.payload as string) ?? 'Could not update the notification.';
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.items.forEach((notification) => {
          notification.read = true;
        });
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.error = (action.payload as string) ?? 'Could not mark notifications as read.';
      });
  },
});

export const { notificationsCleared } = notificationsSlice.actions;
export const notificationsReducer = notificationsSlice.reducer;

export const selectNotifications = (state: { notifications: NotificationsState }) => state.notifications;
export const selectUnreadCount = (state: { notifications: NotificationsState }) =>
  state.notifications.items.filter((notification) => !notification.read).length;
