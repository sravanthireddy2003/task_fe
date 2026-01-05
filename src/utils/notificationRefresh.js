/**
 * Notification Refresh Helper
 * 
 * This utility helps refresh notifications after any create/update/delete action
 * in Redux slices and thunks.
 * 
 * Usage in a thunk:
 * 
 * export const createTask = createAsyncThunk(
 *   'tasks/createTask',
 *   async (payload, thunkAPI) => {
 *     try {
 *       const response = await httpPostService('api/tasks', payload);
 *       
 *       // After successful creation, refresh notifications
 *       await refreshNotificationsAfterAction(thunkAPI);
 *       
 *       return response.data;
 *     } catch (err) {
 *       return thunkAPI.rejectWithValue(formatError(err));
 *     }
 *   }
 * );
 */

import { fetchNotifications } from '../redux/slices/notificationSlice';

/**
 * Refresh notifications after a successful action
 * Adds a 500ms delay to allow backend to process the action
 * 
 * @param {ThunkAPI} thunkAPI - The thunk API object from createAsyncThunk
 * @returns {Promise} - Resolves when notifications are refreshed
 */
export const refreshNotificationsAfterAction = async (thunkAPI) => {
  try {
    // Wait for backend to process the action (500ms buffer)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Dispatch notification fetch
    thunkAPI.dispatch(fetchNotifications());
  } catch (error) {
    console.error('[Notifications] Failed to refresh after action:', error);
  }
};

/**
 * Alternative: Refresh notifications without async thunk context
 * Used in components or non-thunk functions
 * 
 * @param {Function} dispatch - Redux dispatch function
 * @returns {Promise} - Resolves when notifications are refreshed
 */
export const refreshNotificationsNow = async (dispatch) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    dispatch(fetchNotifications());
  } catch (error) {
    console.error('[Notifications] Failed to refresh:', error);
  }
};

/**
 * List of actions that should trigger notification refresh:
 * - Create Task
 * - Create Client
 * - Create Project
 * - Create Department
 * - Create User
 * - Update Task Status
 * - Create Subtask
 * - Assign Task
 * - Create Document
 * And more...
 */
export const ACTIONS_REQUIRING_NOTIFICATION_REFRESH = [
  'tasks/createTask',
  'tasks/updateTask',
  'tasks/deleteTask',
  'clients/createClient',
  'clients/updateClient',
  'clients/deleteClient',
  'projects/createProject',
  'projects/updateProject',
  'projects/deleteProject',
  'departments/createDepartment',
  'departments/updateDepartment',
  'users/createUser',
  'users/updateUser',
  'subtasks/createSubtask',
  'subtasks/updateSubtask',
];

/**
 * Configuration for notification refresh behavior
 */
export const NOTIFICATION_REFRESH_CONFIG = {
  // Delay after action before fetching notifications (ms)
  DELAY_AFTER_ACTION: 500,
  
  // Whether to show toast on notification fetch error
  SHOW_ERROR_TOAST: false,
  
  // Whether to log notification fetch events
  LOG_EVENTS: true,
};
