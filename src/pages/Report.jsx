import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ProjectDropdown from '../components/ProjectDropdown';
import DatePicker from '../components/DatePicker';
import {
  fetchProjects,
  generateProjectReport,
  clearReport
} from '../redux/slices/reportsSlice';

const ReportPage = () => {
  const dispatch = useDispatch();
  const { projects, report, loading, error } = useSelector(
    (s) => s.reports || { projects: [], report: null, loading: false, error: null }
  );

  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    dispatch(fetchProjects());
    return () => dispatch(clearReport());
  }, [dispatch]);

  const handleReset = () => {
    setProjectId('');
    setStartDate('');
    setEndDate('');
    dispatch(clearReport());
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!projectId || !startDate || !endDate) return;
    dispatch(generateProjectReport({ projectId, startDate, endDate }));
  };

  const downloadPDF = async () => {
    const input = document.getElementById('report-content');
    if (!input) return;

    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`project-report-${projectId}.pdf`);
  };

  const reportTasks = Array.isArray(report?.tasks) ? report.tasks : [];
  const summary = report?.summary ?? {};

  const totalTasks = summary.totalTasks ?? reportTasks.length;
  const completedTasks =
    summary.completedTasks ??
    reportTasks.filter((t) => (t.status || '').toLowerCase() === 'completed')
      .length;

  const pendingTasks =
    summary.pendingTasks ??
    reportTasks.filter((t) => {
      const s = (t.status || '').toLowerCase();
      return s === 'pending' || s === 'in-progress' || s === 'not started';
    }).length;

  const overdueTasks =
    summary.overdueTasks ??
    reportTasks.filter(
      (t) =>
        t.dueDate &&
        moment(t.dueDate).isBefore(moment()) &&
        (t.status || '').toLowerCase() !== 'completed'
    ).length;

  const totalHours =
    summary.totalHoursLogged ??
    reportTasks.reduce((s, t) => s + (parseFloat(t.hoursLogged) || 0), 0);

  const statusDistribution = report?.statusDistribution ?? {};
  const userProductivity = report?.userProductivity ?? [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Project Reports
            </h1>
            <p className="text-sm text-gray-500">
              Generate productivity and task insights by project and date range
            </p>
          </div>
          <div className="text-sm text-gray-400 mt-2 md:mt-0">
            {moment().format('dddd, MMMM Do YYYY')}
          </div>
        </div>

        {/* FILTER BAR */}
        <form
          onSubmit={handleGenerate}
          className="bg-gray-100 rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-end"
        >
          <div className="flex-1 min-w-[200px]">
            <ProjectDropdown
              projects={projects}
              value={projectId}
              onChange={setProjectId}
            />
          </div>

          <div className="flex-1 min-w-[160px]">
            <DatePicker
              id="start_date"
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
            />
          </div>

          <div className="flex-1 min-w-[160px]">
            <DatePicker
              id="end_date"
              label="End Date"
              value={endDate}
              onChange={setEndDate}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!projectId || !startDate || !endDate || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={downloadPDF}
              disabled={!report}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Download PDF
            </button>
          </div>
        </form>

        {/* STATES */}
        {loading && (
          <div className="mt-6 text-center text-gray-600">
            Generating report, please wait...
          </div>
        )}

        {error && (
          <div className="mt-6 text-center text-red-600 font-medium">
            {error}
          </div>
        )}

        {!loading && !report && !error && (
          <div className="mt-10 text-center text-gray-500">
            Select a project and date range to generate a report
          </div>
        )}

        {/* REPORT CONTENT */}
        {report && (
          <div id="report-content" className="mt-8">
            {/* PROJECT HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {report?.project?.projectName ?? 'Project Report'}
                </h2>
                <p className="text-sm text-gray-500">
                  {moment(startDate).format('MM/DD/YYYY')} —{' '}
                  {moment(endDate).format('MM/DD/YYYY')}
                </p>
              </div>
              <div className="text-sm text-gray-400 mt-2 md:mt-0">
                Generated on {moment().format('MM/DD/YYYY')}
              </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard title="Total Tasks" value={totalTasks} />
              <SummaryCard
                title="Completed"
                value={completedTasks}
                color="text-green-600"
              />
              <SummaryCard
                title="Pending"
                value={pendingTasks}
                color="text-yellow-600"
              />
              <SummaryCard
                title="Overdue"
                value={overdueTasks}
                color="text-red-600"
              />
            </div>

            {/* ANALYTICS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
              <div className="bg-white border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">
                  Status Distribution
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div>Not Started: {statusDistribution.notStarted ?? 0}</div>
                  <div>In Progress: {statusDistribution.inProgress ?? 0}</div>
                  <div>Completed: {statusDistribution.completed ?? 0}</div>
                </div>
              </div>

              <div className="bg-white border rounded-xl p-4 lg:col-span-2">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">
                  User Productivity
                </h3>

                {userProductivity.length === 0 && (
                  <div className="text-sm text-gray-500">
                    No productivity data available
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userProductivity.map((u, i) => (
                    <div
                      key={i}
                      className="border rounded-lg p-3 bg-gray-50"
                    >
                      <div className="font-medium text-gray-800">
                        {u.userName || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Tasks Completed: {u.tasksCompleted ?? 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        Hours Logged: {u.hoursLogged ?? 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TASK TABLE */}
            <div className="mt-8 border rounded-xl overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr className="text-left text-gray-600">
                      <th className="p-3">Task Name</th>
                      <th className="p-3">Assigned To</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Hours</th>
                      <th className="p-3">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportTasks.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-6 text-center text-gray-500"
                        >
                          No tasks found for this date range
                        </td>
                      </tr>
                    )}

                    {reportTasks.map((t, idx) => (
                      <tr
                        key={idx}
                        className="border-t hover:bg-gray-50 transition"
                      >
                        <td className="p-3 font-medium">
                          {t.taskName || t.title || '—'}
                        </td>
                        <td className="p-3">
                          {t.assignedTo || '—'}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded-full bg-gray-200 text-xs">
                            {t.status || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">
                          {t.hoursLogged || 0}
                        </td>
                        <td className="p-3">
                          {t.dueDate
                            ? moment(t.dueDate).format('MM/DD/YYYY')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td className="p-3">Total</td>
                      <td colSpan="2" />
                      <td className="p-3">
                        {totalHours.toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, color = 'text-gray-800' }) => (
  <div className="bg-white border rounded-xl p-4">
    <div className="text-sm text-gray-500">{title}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </div>
);

export default ReportPage;
