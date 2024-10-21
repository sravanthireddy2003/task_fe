// import React, { useState, useEffect } from 'react';
// import moment from 'moment';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';

// const ReportPage = () => {
//   const [tasks, setTasks] = useState([]);
//   const [selectedTask, setSelectedTask] = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [reportData, setReportData] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const handleReset = () => {
//     setSelectedTask('');
//     setStartDate('');
//     setEndDate('');
//     setReportData([]);
//   };

//   useEffect(() => {
//     const fetchTasks = async () => {
//       try {
//         const response = await fetch('http://localhost:4000/api/tasks/taskdropdown');
//         if (!response.ok) {
//           throw new Error('Failed to fetch tasks');
//         }
//         const data = await response.json();
//         setTasks(data);
//       } catch (error) {
//         setError(error.message);
//       }
//     };

//     fetchTasks();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError(null);

//     try {
//       const response = await fetch(`/api/tasks/report?task_name=${selectedTask}&start_date=${startDate}&end_date=${endDate}`);
//       if (!response.ok) {
//         throw new Error('Failed to fetch report data');
//       }
//       const data = await response.json();
//       setReportData(data);
//     } catch (error) {
//       setError(error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Calculate the total hours
//   const totalHours = reportData.reduce((sum, row) => sum + parseFloat(row.duration_hours), 0);

//   const TableHeader = () => (
//     <thead className='border-b border-gray-300'>
//       <tr className='text-black text-left'>
//         <th className='py-2'>Date</th>
//         <th className='py-2'>Start Time</th>
//         <th className='py-2'>End Time</th>
//         <th className='py-2'>Duration (Hrs)</th>
//       </tr>
//     </thead>
//   );

//   const TableRow = ({ row }) => (
//     <tr className='border-b border-gray-300 text-gray-600 hover:bg-gray-300/10'>
//       <td className='py-2'>{moment(row.working_date).format('YYYY-MM-DD')}</td>
//       <td className='py-2'>{row.start_time}</td>
//       <td className='py-2'>{row.end_time}</td>
//       <td className='py-2'>{row.duration_hours}</td>
//     </tr>
//   );

//   return (
//     <div className='h-full py-4'>
//       <div className='w-full bg-white p-4 shadow-md rounded'>
//         <h1 className='text-2xl font-semibold text-gray-600 mb-4'>Generate Report</h1>
//         <form onSubmit={handleSubmit} className='flex flex-col md:flex-row gap-4'>
//           <div className='flex flex-col'>
//             <label htmlFor='task_name' className='text-gray-700 mb-1'>Task Name:</label>
//             <select
//               id='task_name'
//               value={selectedTask}
//               onChange={(e) => setSelectedTask(e.target.value)}
//               className='border border-gray-300 p-2 rounded'
//               required
//             >
//               <option value='' disabled>Select a task</option>
//               {tasks.map(task => (
//                 <option key={task.id} value={task.title}>
//                   {task.title}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className='flex flex-col'>
//             <label htmlFor='start_date' className='text-gray-700 mb-1'>Start Date:</label>
//             <input
//               type='date'
//               id='start_date'
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//               className='border border-gray-300 p-2 rounded'
//               required
//             />
//           </div>
//           <div className='flex flex-col'>
//             <label htmlFor='end_date' className='text-gray-700 mb-1'>End Date:</label>
//             <input
//               type='date'
//               id='end_date'
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//               className='border border-gray-300 p-2 rounded'
//               required
//             />
//           </div>
//           <button type='submit' className='bg-blue-500 text-white px-4 py-2 rounded'>
//             Generate Report
//           </button>
//           <button
//             type='button'
//             className='bg-red-500 text-white px-10 py-2 rounded'
//             onClick={handleReset}
//           >
//             Reset
//           </button>
//         </form>

//         {isLoading && <p className='mt-4'>Loading...</p>}
//         {error && <p className='mt-4 text-red-500'>{error}</p>}

//         {reportData.length > 0 && (
//           <div className='mt-6'>
//             <h2 className='text-xl font-semibold text-gray-600 mb-4'>Report Results</h2>
//             <table className='w-full'>
//               <TableHeader />
//               <tbody>
//                 {reportData.map((row, index) => (
//                   <TableRow key={index} row={row} />
//                 ))}

//                 <tr className='font-bold text-gray-700'>
//                   <td className='py-2' colSpan='3'>Total Hours</td>
//                   <td className='py-2'>{totalHours.toFixed(2)}</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ReportPage;







import React, { useState, useEffect } from 'react';
import moment from 'moment';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ReportPage = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReset = () => {
    setSelectedTask('');
    setStartDate('');
    setEndDate('');
    setReportData([]);
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/tasks/taskdropdown');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tasks/report?task_name=${selectedTask}&start_date=${startDate}&end_date=${endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  
  const totalHours = reportData.reduce((sum, row) => sum + parseFloat(row.hours), 0);

  const TableHeader = () => (
    <thead className='border-b border-gray-300'>
      <tr className='text-black text-left'>
        <th className='py-2'>Date</th>
        {/* <th className='py-2'>Start Time</th>
        <th className='py-2'>End Time</th> */}
        <th className='py-2'>Duration (Hrs)</th>
      </tr>
    </thead>
  );

  const TableRow = ({ row }) => (
    <tr className='border-b border-gray-300 text-gray-600 hover:bg-gray-300/10'>
      <td className='py-2'>{moment(row.date).format('YYYY-MM-DD')}</td>
      {/* <td className='py-2'>{row.start_time}</td>
      <td className='py-2'>{row.end_time}</td> */}
      <td className='py-2'>{row.hours}</td>
    </tr>
  );

  const downloadPDF = () => {
    const input = document.getElementById('report-content');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      pdf.addImage(imgData, 'PNG', 10, 10);
      pdf.save('report.pdf');
    });
  };

  return (
    <div className='h-full py-4'>
      <div className='w-full bg-white p-4 shadow-md rounded'>
        <h1 className='text-2xl font-semibold text-gray-600 mb-4'>Generate Report</h1>
        <form onSubmit={handleSubmit} className='flex flex-col md:flex-row gap-4'>
          <div className='flex flex-col'>
            <label htmlFor='task_name' className='text-gray-700 mb-1'>Task Name:</label>
            <select
              id='task_name'
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className='border border-gray-300 p-2 rounded'
              required
            >
              <option value='' disabled>Select a task</option>
              {tasks.map(task => (
                <option key={task.id} value={task.title}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>
          <div className='flex flex-col'>
            <label htmlFor='start_date' className='text-gray-700 mb-1'>Start Date:</label>
            <input
              type='date'
              id='start_date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className='border border-gray-300 p-2 rounded'
              required
            />
          </div>
          <div className='flex flex-col'>
            <label htmlFor='end_date' className='text-gray-700 mb-1'>End Date:</label>
            <input
              type='date'
              id='end_date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className='border border-gray-300 p-2 rounded'
              required
            />
          </div>
          <button type='submit' className='bg-blue-500 text-white px-4 py-2 rounded'>
            Generate Report
          </button>
          <button
            type='button'
            className='bg-red-500 text-white px-10 py-2 rounded'
            onClick={handleReset}
          >
            Reset
          </button>
   
          <button
  type='button'
  className={`bg-green-500 text-white px-10 py-2 rounded ${reportData.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
  onClick={downloadPDF}
  disabled={reportData.length === 0}
>
  Download PDF
</button>
        </form>
        {isLoading && <p className='mt-4'>Loading...</p>}
        {error && <p className='mt-4 text-red-500'>{error}</p>}

        {reportData.length > 0 && (
          <div id="report-content" className='mt-6'>
            <h2 className='text-xl font-semibold text-gray-600 mb-4'>Report Results</h2>
            <h3 className='text-xl font-semibold text-red-600 mb-4'>TASK - {reportData[0].task_title}</h3>
            <table className='w-full'>
              <TableHeader />
              <tbody>
                {reportData.map((row, index) => (
                  <TableRow key={index} row={row} />
                ))
                }
                <tr className='font-bold text-gray-700'>
                  <td className='py-2' colSpan='1'>Total Hours</td>
                  <td className='py-2'>{totalHours.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;
