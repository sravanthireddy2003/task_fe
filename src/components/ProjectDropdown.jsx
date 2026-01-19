import React from 'react';

const ProjectDropdown = ({ projects = [], value, onChange, id = 'project_id', label = 'Project' }) => {
  return (
    <div className='flex flex-col'>
      <label htmlFor={id} className='text-gray-700 mb-1'>{label}:</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='border border-gray-300 p-2 rounded'
      >
        <option value=''>Select a project</option>
        {projects.map((p) => {
          const val = p.projectId ?? p.project_id ?? p.public_id ?? p.publicId ?? p.id ?? p._id;
          const labelText = p.projectName ?? p.name ?? p.title ?? p.project_name ?? val;
          return (
            <option key={val} value={val}>
              {labelText}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default ProjectDropdown;
