import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications } from '../redux/slices/notificationSlice';

/**
 * Hook to fetch notifications on initial app load (after login)
 * Usage: Call once in main app component (App.jsx)
 */
export const useNotificationsOnLoad = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only fetch when user is authenticated
    if (user && user.id) {
      dispatch(fetchNotifications());
    }
  }, [user?.id, dispatch]);
};

/**
 * Hook to refetch notifications after a creation/action
 * Usage: Call in slices or components after successful creation
 * 
 * Example:
 *   const refetchNotifications = useRefreshNotifications();
 *   await dispatch(createTask(...));
 *   refetchNotifications(); // Show new notification immediately
 */
export const useRefreshNotifications = () => {
  const dispatch = useDispatch();

  return async () => {
    try {
      // Add small delay to ensure backend has processed the creation
      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch(fetchNotifications());
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };
};

/**
 * Function to refetch notifications (for use in thunks/async functions)
 * Usage: In Redux thunks where you don't have access to hooks
 * 
 * Example in a thunk:
 *   const response = await httpPostService('api/tasks', payload);
 *   // After successful creation, refresh notifications
 *   thunkAPI.dispatch(fetchNotifications());
 */
export const dispatchNotificationRefresh = (dispatch) => {
  return async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch(fetchNotifications());
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };
};
