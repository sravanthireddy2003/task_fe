import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Table from '../components/task/Table';  // Reusable table component for tasks
import Button from '../components/Button';
import { FaEdit } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientDetails, fetchClientTasks } from '../redux/slices/clientSlice';

const ClientDetailPage = () => {
  const { clientId } = useParams();  // Fetch client ID from URL params
  const dispatch = useDispatch();
  
  // Client, tasks, reports, employees state from Redux
  const clientDetails = useSelector(state => state.clients.clientDetails);
  const clientTasks = useSelector(state => state.clients.clientTasks);
  const isLoading = useSelector(state => state.clients.isLoading);

  // States for opening modals or forms
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState(false);

  useEffect(() => {
    // Fetch client details and tasks when the page loads
    dispatch(fetchClientDetails(clientId));
    dispatch(fetchClientTasks(clientId));
  }, [clientId, dispatch]);

  // Dummy employee data and client tasks for now
  const employees = [
    { id: 1, name: 'John Doe', role: 'Developer' },
    { id: 2, name: 'Jane Smith', role: 'Designer' },
  ];

  const handleEditTask = (task) => {
    // Handle task editing logic
    console.log("Editing task: ", task);
  };

  const handleAssignEmployee = () => {
    // Logic for assigning employees
    console.log('Assigning employees to tasks for client', clientId);
  };

  const handleGenerateReport = () => {
    // Logic for generating reports
    console.log('Generating report for client', clientId);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Client Overview Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Client: {clientDetails?.name}</h1>
        <p className="text-gray-700">Company: {clientDetails?.company}</p>
        <p className="text-gray-700">Email: {clientDetails?.email}</p>
        <p className="text-gray-700">Phone: {clientDetails?.phone}</p>
      </div>

      {/* Actions: Add task or report */}
      <div className="flex justify-end gap-4 mb-8">
        <Button
          label="Add New Task"
          onClick={() => setTaskModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        />
        <Button
          label="Generate Report"
          onClick={() => setReportModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded"
        />
        <Button
          label="Assign Employees"
          onClick={() => setEmployeeModalOpen(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded"
        />
      </div>

      {/* Task List Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Tasks for {clientDetails?.name}</h2>
        {isLoading ? (
          <p>Loading tasks...</p>
        ) : (
          <div className="overflow-x-auto">
            <Table
              clients={clientTasks}
              onEdit={handleEditTask}
            />
          </div>
        )}
      </div>

      {/* Reports Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Manage Reports</h2>
        <div>
          <p>Manage and generate reports for this client</p>
          <Button
            label="Generate New Report"
            onClick={handleGenerateReport}
            className="bg-green-500 text-white px-4 py-2 mt-4"
          />
        </div>
      </div>

      {/* Employee Management Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Employees Assigned to Tasks</h2>
        <div>
          <p>Manage employees working on this client's tasks</p>
          <table className="min-w-full table-auto border-collapse mt-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Employee Name</th>
                <th className="border px-4 py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="border px-4 py-2">{employee.name}</td>
                  <td className="border px-4 py-2">{employee.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button
            label="Assign More Employees"
            onClick={handleAssignEmployee}
            className="bg-blue-500 text-white px-4 py-2 mt-4"
          />
        </div>
      </div>

      {/* Modals for task creation, report, and employee assignment */}
      {isTaskModalOpen && <div>{/* Modal for adding tasks */}</div>}
      {isReportModalOpen && <div>{/* Modal for generating reports */}</div>}
      {isEmployeeModalOpen && <div>{/* Modal for assigning employees */}</div>}
    </div>
  );
};

export default ClientDetailPage;
