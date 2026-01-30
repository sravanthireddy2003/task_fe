import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import ChatInterface from '../components/ChatInterface';
import { httpGetService } from '../App/httpHandler';
import ChatPageLayout from '../components/ChatPageLayout';
import { ChatLoadingScreen, ChatEmptyState } from '../components/ChatStates';

const ManagerChat = () => {
  const { user } = useSelector((state) => state.auth);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch projects managed by this manager
  const fetchManagedProjects = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch projects managed by this manager
      const res = await httpGetService('api/projects?manager_id=' + user?.id);
      if (res?.success) {
        const managedProjects = res.data || [];
        setProjects(managedProjects);
        if (managedProjects.length > 0) {
          setSelectedProjectId(managedProjects[0]._id || managedProjects[0].id);
        }
      } else {
        toast.error('Failed to load projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      toast.error(err?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) fetchManagedProjects();
  }, [user?.id, fetchManagedProjects]);

  if (loading) {
    return <ChatLoadingScreen />;
  }

  if (!projects.length) {
    return (
      <ChatEmptyState
        title="No projects found"
        description="Create a project to start team collaboration"
      />
    );
  }

  const selectedProject = projects.find(
    (p) => (p._id || p.id) === selectedProjectId
  );

  return (
    <ChatPageLayout
      title="Team Chat"
      projects={projects}
      selectedProjectId={selectedProjectId}
      onSelectProject={setSelectedProjectId}
      onRefresh={fetchManagedProjects}
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

export default ManagerChat;
