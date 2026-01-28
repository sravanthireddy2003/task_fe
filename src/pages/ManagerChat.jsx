import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import * as Icons from '../icons';

const { Loader, MessageCircle } = Icons;
import { toast } from 'sonner';
import ChatInterface from '../components/ChatInterface';
import { httpGetService } from '../App/httpHandler';
import ChatPageLayout from '../components/ChatPageLayout';

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
          <p className="text-gray-500 text-sm mb-4">Create a project to start team collaboration</p>
        </div>
      </div>
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
