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

  // Fetch projects strictly assigned to this employee
  const fetchAssignedProjects = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch accessible projects
      const res = await httpGetService('api/projects');
      let allProjects = res?.success ? (res.data || []) : [];

      // 2. Fetch tasks assigned to this user to see where they are participants
      let userTasks = [];
      try {
        const taskRes = await httpGetService('api/employee/my-tasks');
        if (taskRes?.success && taskRes.data && taskRes.data.length > 0) {
          userTasks = taskRes.data;
        } else {
          // Fallback
          const fallbackRes = await httpGetService(`api/tasks?assignedTo=${user?.id}`);
          if (fallbackRes?.success && fallbackRes.data) userTasks = fallbackRes.data;
        }
      } catch (e) {}

      const assignedProjectIds = new Set();
      userTasks.forEach(task => {
        if (task.project) {
          assignedProjectIds.add(String(task.project.publicId || task.project.id));
        }
        if (task.projectId || task.project_id) {
          assignedProjectIds.add(String(task.projectId || task.project_id));
        }
      });

      // 3. Keep ONLY projects where user has tasks assigned
      const filteredProjects = allProjects.filter(p => {
        const isAssigned = assignedProjectIds.has(String(p.public_id)) ||
          assignedProjectIds.has(String(p.id)) ||
          assignedProjectIds.has(String(p._id));

        return isAssigned;
      });

      setProjects(filteredProjects);

      if (filteredProjects.length > 0) {
        setSelectedProjectId(filteredProjects[0]._id || filteredProjects[0].id || filteredProjects[0].publicId || filteredProjects[0].public_id);
      } else {
        setSelectedProjectId(null);
      }
    } catch (err) {
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
    (p) => (p._id || p.id || p.publicId || p.public_id) === selectedProjectId
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
