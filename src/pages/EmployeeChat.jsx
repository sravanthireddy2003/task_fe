import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import * as Icons from '../icons';

const { MessageCircle } = Icons;
import { toast } from 'sonner';
import ChatInterface from '../components/ChatInterface';
import { httpGetService } from '../App/httpHandler';
import ChatPageLayout from '../components/ChatPageLayout';

const EmployeeChat = () => {
  const { user } = useSelector((state) => state.auth);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch projects assigned to this employee
  const fetchAssignedProjects = useCallback(async () => {
    try {
      setLoading(true);

      // Try to fetch tasks assigned to this user
      let userTasks = [];
      try {
        const res = await httpGetService('api/employee/my-tasks');
        if (res?.success && res?.data && res.data.length > 0) {
          userTasks = res.data;
          console.log('Tasks fetched from: api/employee/my-tasks', userTasks.length);
        }
      } catch (e) {
        console.log('Failed to fetch from api/employee/my-tasks, trying fallback...');
        // Fallback to the old method if needed
        const paramVariations = [
          `api/tasks?assigned_to=${user?.id}`,
          `api/tasks?assignedTo=${user?.id}`,
          `api/tasks?user_id=${user?.id}`,
          `api/tasks?userId=${user?.id}`,
          `api/tasks?employee_id=${user?.id}`,
          `api/employee/tasks`,
        ];

        for (const param of paramVariations) {
          try {
            const res = await httpGetService(param);
            if (res?.success && res?.data && res.data.length > 0) {
              userTasks = res.data;
              console.log(`Tasks fetched from: ${param}`, userTasks.length);
              break;
            }
          } catch (e) {
            console.log(`Failed to fetch from ${param}, trying next...`);
            continue;
          }
        }
      }

      // Extract unique projects from tasks
      if (userTasks && userTasks.length > 0) {
        const projectMap = new Map();

        userTasks.forEach((task) => {
          if (task.project) {
            const projectId = task.project.publicId || task.project.id;
            const projectName = task.project.name || task.project.title || 'Unknown Project';

            if (projectId && !projectMap.has(projectId)) {
              projectMap.set(projectId, {
                id: projectId,
                _id: projectId, // For compatibility
                name: projectName,
                title: projectName, // For compatibility
              });
            }
          }
        });

        const assignedProjects = Array.from(projectMap.values());

        console.log(`Projects extracted from tasks: ${assignedProjects.length}`);
        setProjects(assignedProjects);

        if (assignedProjects.length > 0) {
          setSelectedProjectId(assignedProjects[0].id);
        }
      } else {
        // If no tasks found, show no projects
        console.warn('No tasks found for employee');
        setProjects([]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      toast.error(err?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) fetchAssignedProjects();
  }, [user?.id, fetchAssignedProjects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
            <MessageCircle className="w-5 h-5 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 text-sm mt-3">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-sm p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No projects found</h3>
          <p className="text-gray-500 text-sm mb-2">You haven't been assigned to any projects yet.</p>
          <p className="text-gray-400 text-xs">Once tasks are assigned to you, you'll see chat channels here.</p>
        </div>
      </div>
    );
  }

  const selectedProject = projects.find(
    (p) => (p._id || p.id) === selectedProjectId
  );

  return (
    <ChatPageLayout
      title="Team Communication"
      projects={projects}
      selectedProjectId={selectedProjectId}
      onSelectProject={setSelectedProjectId}
      onRefresh={fetchAssignedProjects}
      user={user}
    >
      {selectedProject ? (
        <ChatInterface
          projectId={selectedProjectId}
          projectName={selectedProject.name || selectedProject.title}
          authToken={localStorage.getItem('tm_access_token')}
          currentUserId={user?._id || user?.id}
          currentUserName={user?.name}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Select a project to start chatting</p>
          </div>
        </div>
      )}
    </ChatPageLayout>
  );
};

export default EmployeeChat;
