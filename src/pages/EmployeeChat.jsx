import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import * as Icons from '../icons';

const { Loader } = Icons;
import { toast } from 'sonner';
import ChatInterface from '../components/ChatInterface';
import { httpGetService } from '../App/httpHandler';
import clsx from 'clsx';

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
        
        // Try to fetch tasks assigned to this user
        let userTasks = [];
        try {
          const res = await httpGetService('api/employee/my-tasks');
          if (res?.success && res?.data && res.data.length > 0) {
            userTasks = res.data;
            console.log('✅ Tasks fetched from: api/emploee/my-tasks', userTasks.length);
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
        
        // Extract unique projects from tasks
        if (userTasks && userTasks.length > 0) {
          const projectMap = new Map();
          
          userTasks.forEach(task => {
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
          
          console.log(`📊 Projects extracted from tasks: ${assignedProjects.length}`);
          setProjects(assignedProjects);
          
          if (assignedProjects.length > 0) {
            setSelectedProjectId(assignedProjects[0].id);
          }
        } else {
          // If no tasks found, show no projects
          console.warn('⚠️ No tasks found for employee');
          setProjects([]);
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
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <div>
            <h3 className="text-h3 font-medium text-slate-900">Loading your workspace</h3>
            <p className="text-caption text-slate-500 mt-1">Fetching your assigned projects...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-heading-3 font-semibold text-gray-900">No projects assigned</h2>
            <p className="text-body text-slate-600 mt-2">
              You haven't been assigned to any projects yet. Once tasks are assigned to you, you'll be able to communicate with your team here.
            </p>
          </div>
          <div className="bg-slate-100 rounded-xl p-4">
            <p className="text-caption text-slate-500">
              💡 <strong>Pro tip:</strong> Check with your manager if you expect to be assigned to projects soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedProject = projects.find(
    (p) => (p._id || p.id) === selectedProjectId
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading-3 font-semibold text-gray-900">Team Communication</h1>
            <p className="text-caption text-gray-500 mt-1">
              Collaborate with your team on {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg">
              <span className="text-caption font-medium">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <label className="block text-caption font-medium text-slate-700 mb-3">
            Select Project to Chat
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((project) => (
              <button
                key={project._id || project.id}
                onClick={() => setSelectedProjectId(project._id || project.id)}
                className={clsx(
                  "p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                  (project._id || project.id) === selectedProjectId
                    ? "border-primary-500 bg-primary-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-body font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">
                      {project.name || project.title}
                    </h3>
                    <p className="text-caption text-slate-500 mt-1">
                      Project workspace
                    </p>
                  </div>
                  {(project._id || project.id) === selectedProjectId && (
                    <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      {selectedProject && (
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            projectId={selectedProjectId}
            projectName={selectedProject.name || selectedProject.title}
            authToken={localStorage.getItem('tm_access_token')}
            currentUserId={user?._id || user?.id}
            currentUserName={user?.name}
          />
        </div>
      )}
    </div>
  );
};

export default EmployeeChat;
