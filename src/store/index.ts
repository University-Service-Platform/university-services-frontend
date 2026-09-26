import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { activityReducer } from './activitySlice';
import { notificationsReducer } from './notificationsSlice';

/**
 * Shared Redux Store
 *
 * Holds only shared, long-lived state that several screens depend on
 * (e.g. the notification inbox shown in both the header bell and the
 * Notification Center). Page-local form state stays in component state.
 * Feature slices register their reducers in `rootReducer` below.
 */
const rootReducer = {
  activity: activityReducer,
  notifications: notificationsReducer,
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export * from './activitySlice';
export * from './notificationsSlice';
