import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import ChatInterface from '../components/ChatInterface';
import { httpGetService } from '../App/httpHandler';
import ChatPageLayout from '../components/ChatPageLayout';
import { ChatLoadingScreen, ChatEmptyState } from '../components/ChatStates';

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
        }
      } catch (e) {
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
              break;
            }
          } catch (e) {
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
    return <ChatLoadingScreen />;
  }

  if (!projects.length) {
    return (
      <ChatEmptyState
        title="No projects found"
        description="You haven't been assigned to any projects yet."
        helperText="Once tasks are assigned to you, you'll see chat channels here."
      />
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
