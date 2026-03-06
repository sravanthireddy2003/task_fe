import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import ChatInterface from '../components/ChatInterface';
import { httpGetService } from '../App/httpHandler';
import ChatPageLayout from '../components/ChatPageLayout';
import { ChatLoadingScreen, ChatEmptyState } from '../components/ChatStates';
import * as Icons from '../icons';

const { MessageCircle } = Icons;

const Chat = () => {
  const { user } = useSelector((state) => state.auth);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch projects for admin
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await httpGetService('api/projects');
      if (res?.success) {
        setProjects(res.data || []);
        if (res.data?.length > 0) {
          setSelectedProjectId(res.data[0]._id || res.data[0].id);
        }
      } else {
        toast.error('Failed to load projects');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (loading) {
    return <ChatLoadingScreen />;
  }

  if (!projects.length) {
    return (
      <ChatEmptyState
        title="No projects found"
        description="Create a project to start team collaboration"
        actionLabel="Create New Project"
        onAction={() => { }}
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
      onRefresh={fetchProjects}
      user={user}
    >
      {selectedProject ? (
        <ChatInterface
          projectId={selectedProjectId}
          projectName={selectedProject.name || selectedProject.title || 'Team Chat'}
          authToken={localStorage.getItem('tm_access_token')}
          currentUserId={user?._id || user?.id}
          currentUserName={user?.name}
          projectDescription={selectedProject.description}
          teamSize={selectedProject.teamSize || selectedProject.membersCount || 0}
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

export default Chat;