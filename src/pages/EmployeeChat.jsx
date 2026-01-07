import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';
import ChatInterface from '../components/ChatInterface';
import { httpGetService } from '../App/httpHandler';

const EmployeeChat = () => {
  const { user } = useSelector((state) => state.auth);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch projects assigned to this employee
  useEffect(() => {
    const fetchAssignedProjects = async () => {
      try {
        setLoading(true);
        
        // Fetch all projects first
        const projectsRes = await httpGetService('api/projects');
        if (!projectsRes?.success) {
          toast.error('Failed to load projects');
          setLoading(false);
          return;
        }
        
        const allProjects = projectsRes.data || [];
        
        // Try to fetch tasks assigned to this user
        let userTasks = [];
        try {
          const res = await httpGetService('api/employee/my-tasks');
          if (res?.success && res?.data && res.data.length > 0) {
            userTasks = res.data;
            console.log('✅ Tasks fetched from: api/employee/my-tasks', userTasks.length);
          }
        } catch (e) {
          console.log('⚠️ Failed to fetch from api/employee/my-tasks, trying fallback...');
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
                console.log(`✅ Tasks fetched from: ${param}`, userTasks.length);
                break;
              }
            } catch (e) {
              console.log(`⚠️ Failed to fetch from ${param}, trying next...`);
              continue;
            }
          }
        }
        
        // If we got tasks, filter projects by those tasks
        if (userTasks && userTasks.length > 0) {
          const projectIdSet = new Set(
            userTasks
              .map(task => task.project?.publicId || task.project?.id || task.project_id || task.projectId)
              .filter(id => id)
          );
          
          const assignedProjects = allProjects.filter(p => 
            projectIdSet.has(p._id) || projectIdSet.has(p.id)
          );
          
          console.log(`📊 Projects with tasks: ${assignedProjects.length} out of ${allProjects.length}`);
          setProjects(assignedProjects);
          
          if (assignedProjects.length > 0) {
            setSelectedProjectId(assignedProjects[0]._id || assignedProjects[0].id);
          }
        } else {
          // If no tasks found or API failed, show all projects as fallback
          console.warn('⚠️ No tasks found for employee, showing all projects as fallback');
          setProjects(allProjects);
          if (allProjects.length > 0) {
            setSelectedProjectId(allProjects[0]._id || allProjects[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        toast.error(err?.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAssignedProjects();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="animate-spin w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No projects assigned</p>
          <p className="text-gray-400 text-sm">You'll see your projects once tasks are assigned</p>
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
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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

export default EmployeeChat;
