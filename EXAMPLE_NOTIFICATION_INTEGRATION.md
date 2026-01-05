// EXAMPLE: How to Update taskSlice.js to Refresh Notifications

// STEP 1: Add import at the top of the file
import { fetchNotifications } from './notificationSlice';

// ============================================================================
// STEP 2: Update the createTask thunk (around line 95)
// ============================================================================

// BEFORE:
/*
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (payload, thunkAPI) => {
    try {
      // ... existing code ...
      const res = await httpPostService('api/tasks', body);
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);
*/

// AFTER:
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (payload, thunkAPI) => {
    try {
      // ... existing code (all the body normalization) ...
      const res = await httpPostService('api/tasks', body);
      
      // ✅ NEW: Refresh notifications after successful task creation
      // Wait 500ms for backend to process the creation
      await new Promise(resolve => setTimeout(resolve, 500));
      // Dispatch notification fetch to update the bell icon
      thunkAPI.dispatch(fetchNotifications());
      
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

// ============================================================================
// STEP 3: Update updateTask thunk (similar pattern)
// ============================================================================

// BEFORE:
/*
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (payload, thunkAPI) => {
    try {
      // ... existing code ...
      const res = await httpPutService(`api/tasks/${taskId}`, body);
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);
*/

// AFTER:
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (payload, thunkAPI) => {
    try {
      // ... existing code ...
      const res = await httpPutService(`api/tasks/${taskId}`, body);
      
      // ✅ NEW: Refresh notifications after update
      await new Promise(resolve => setTimeout(resolve, 500));
      thunkAPI.dispatch(fetchNotifications());
      
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

// ============================================================================
// STEP 4: Update deleteTask thunk (similar pattern)
// ============================================================================

// BEFORE:
/*
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, thunkAPI) => {
    try {
      const res = await httpDeleteService(`api/tasks/${taskId}`);
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);
*/

// AFTER:
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, thunkAPI) => {
    try {
      const res = await httpDeleteService(`api/tasks/${taskId}`);
      
      // ✅ NEW: Refresh notifications after delete
      await new Promise(resolve => setTimeout(resolve, 500));
      thunkAPI.dispatch(fetchNotifications());
      
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

// ============================================================================
// IMPORTANT: Apply same pattern to ALL other slices:
// ============================================================================

/*
Files to update with same pattern:
1. src/redux/slices/taskSlice.js
   - createTask ✅
   - updateTask ✅
   - deleteTask ✅
   - updateTaskStatus (if exists)
   - assignTask (if exists)

2. src/redux/slices/clientSlice.js
   - createClient
   - updateClient
   - deleteClient

3. src/redux/slices/projectSlice.js
   - createProject
   - updateProject
   - deleteProject

4. src/redux/slices/departmentSlice.js
   - createDepartment
   - updateDepartment
   - deleteDepartment

5. src/redux/slices/userSlice.js
   - createUser
   - updateUser
   - deleteUser

6. src/redux/slices/subtaskSlice.js
   - createSubtask
   - updateSubtask
   - deleteSubtask

The pattern is always the same:
- Add import: import { fetchNotifications } from './notificationSlice';
- After successful API call, add:
    await new Promise(resolve => setTimeout(resolve, 500));
    thunkAPI.dispatch(fetchNotifications());
*/

// ============================================================================
// That's it! The notifications will now update immediately after creation.
// ============================================================================
