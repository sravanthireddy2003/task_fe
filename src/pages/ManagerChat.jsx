import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import * as Icons from '../icons';

const { Loader } = Icons;
import { toast } from 'sonner';
import ChatInterface from '../components/ChatInterface';
import { httpGetService } from '../App/httpHandler';

const ManagerChat = () => {
  const { user } = useSelector((state) => state.auth);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch projects managed by this manager
  useEffect(() => {
    const fetchManagedProjects = async () => {
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
    };

    if (user?.id) {
      fetchManagedProjects();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="animate-spin w-12 h-12 text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No projects to chat about</p>
          <p className="text-gray-400 text-sm">Create a project to start collaborating</p>
        </div>
      </div>
    );
  }

  const selectedProject = projects.find(
    (p) => (p._id || p.id) === selectedProjectId
  );

  return (
    <div className="h-screen flex flex-col gap-4 bg-gray-50 p-4">
      {/* ===== PROJECT SELECTOR ===== */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow border border-gray-200">
        <label htmlFor="project-select" className="font-semibold text-gray-700">
          Your Projects:
        </label>
        <select
          id="project-select"
          value={selectedProjectId || ''}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {projects.map((project) => (
            <option key={project._id || project.id} value={project._id || project.id}>
              {project.name || project.title}
            </option>
          ))}
        </select>
        <div className="text-sm text-gray-600 font-medium">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ===== CHAT INTERFACE ===== */}
      {selectedProject && (
        <ChatInterface
          projectId={selectedProjectId}
          projectName={selectedProject.name || selectedProject.title}
          authToken={localStorage.getItem('tm_access_token')}
          currentUserId={user?._id || user?.id}
          currentUserName={user?.name}
        />
      )}
    </div>
  );
};

export default ManagerChat;
