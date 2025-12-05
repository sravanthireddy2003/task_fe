import clsx from "clsx";
import moment from "moment";
import React, { useState, useEffect } from "react";
import { FaBug, FaTasks, FaThumbsUp, FaUser } from "react-icons/fa";
import { GrInProgress } from "react-icons/gr";
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
  MdOutlineDoneAll,
  MdOutlineMessage,
  MdTaskAlt,
} from "react-icons/md";
import { RxActivityLog } from "react-icons/rx";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import Tabs from "../components/Tabs";
import { PRIOTITYSTYELS, TASK_TYPE, getInitials } from "../utils";
import Loading from "../components/Loader";
import Button from "../components/Button";
import { useSelector, useDispatch } from "react-redux";
import { selectTasks, fetchTasksbyId, selectSubTasks, getSubTask } from "../redux/slices/taskSlice";
import { Clock, User, Info } from 'lucide-react';
import { httpPostService, httpGetService } from '../App/httpHandler';


const assets = [
  "https://images.pexels.com/photos/2418664/pexels-photo-2418664.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/8797307/pexels-photo-8797307.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  // "https://images.pexels.com/photos/2534523/pexels-photo-2534523.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  // "https://images.pexels.com/photos/804049/pexels-photo-804049.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
];

const ICONS = {
  high: <MdKeyboardDoubleArrowUp />,
  medium: <MdKeyboardArrowUp />,
  low: <MdKeyboardArrowDown />,
};

const bgColor = {
  high: "bg-red-200",
  medium: "bg-yellow-200",
  low: "bg-blue-200",
};

const TABS = [
  { title: "Task Detail", icon: <FaTasks /> },
  { title: "Activities/Timeline", icon: <RxActivityLog /> },
];

const TASKTYPEICON = {
  commented: (
    <div className='w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white'>
      <MdOutlineMessage />,
    </div>
  ),
  started: (
    <div className='w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white'>
      <FaThumbsUp size={20} />
    </div>
  ),
  assigned: (
    <div className='w-6 h-6 flex items-center justify-center rounded-full bg-gray-500 text-white'>
      <FaUser size={14} />
    </div>
  ),
  bug: (
    <div className='text-red-600'>
      <FaBug size={24} />
    </div>
  ),
  completed: (
    <div className='w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white'>
      <MdOutlineDoneAll size={24} />
    </div>
  ),
  "in progress": (
    <div className='w-8 h-8 flex items-center justify-center rounded-full bg-violet-600 text-white'>
      <GrInProgress size={16} />
    </div>
  ),
};

const act_types = [
  "Started",
  "Completed",
  "In Progress",
  "Commented",
  "Bug",
  "Assigned",
];

const TaskDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [selected, setSelected] = useState(0);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subtasks, setsubTask] = useState([]);
  const [totalWorkingHours, setTotalWorkingHours] = useState(null);
  const [Activitiesdata,setActivitiesdata]=useState(null);

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [getfile,setgetfile]=useState(null);



  const task_id=id;

  // useEffect(() => {
  //   const fetchTaskActivities = async () => {
  //     try {
  //       const response = await fetch(`${import.meta.env.VITE_SERVERURL}/api/tasks/taskdetail/getactivity/${task_id}`);
  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }

  //       const data = await response.json();
  //       setActivitiesdata(data);
  //       // setTimeout(fetchTaskActivities, 5000);
  //     } catch (err) {
  //       console.error("Error fetching task activities:", err);
  //       setError("Failed to load task activities.");
  //     }
  //   };

  //   if (task_id) {
  //     fetchTaskActivities();
  //   }
  // }, [task_id]);

  useEffect(() => {
    const fetchTaskActivities = async () => {
      try {
        const data = await httpGetService(`api/tasks/taskdetail/getactivity/${task_id}`);
        // normalize shapes (some endpoints return { data: [...] } or [...])
        setActivitiesdata(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        console.error("Error fetching task activities:", err);
        setError("Failed to load task activities.");
      }
    };
  
    if (task_id) {
      fetchTaskActivities(); // Fetch immediately
      const interval = setInterval(fetchTaskActivities, 5000); // Fetch every 5 seconds
  
      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [task_id]); // Re-run when task_id changes
  

  useEffect(() => {
    const fetchTotalWorkingHours = async (task_id) => {
      try {
        const data = await httpGetService(`api/tasks/total-working-hours/${task_id}`);
        // backend may return { total_working_hours } or the value directly
        const hours = data?.total_working_hours ?? data?.total ?? data;
        return hours;
      } catch (error) {
        console.error('Error fetching total working hours:', error);
        throw error;
      }
    };

    const getTotalWorkingHours = async () => {
      try {
        if (task_id) {
          const hours = await fetchTotalWorkingHours(task_id);
          setTotalWorkingHours(hours);
        }
      } catch (error) {
        setError(error.message);
      }
    };

    getTotalWorkingHours();
  }, [task_id]);
  
    useEffect(() => {
      const fetchupload = async () => {
        try {
          const result = await httpGetService(`api/uploads/getuploads/${task_id}`);
          setgetfile(Array.isArray(result) ? result : result?.data || []);
        } catch (err) {
          console.error("Error fetching uploads:", err);
          setError("Failed to load uploads.");
        }
      };
  
      if (task_id) {
        fetchupload();
      }
    }, [task_id]);


  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await dispatch(fetchTasksbyId({ task_id: id })).unwrap();
        setTask(response);
        } catch (err) {
          setError(err.message);
          toast.error("Failed to fetch task details");
          } finally {
            setLoading(false);
            }
            };
            fetchTask();
            }, [dispatch, id]);
            
  // const subtasks = useSelector(selectSubTasks);

            useEffect(() => {
              const fetchsubTask = async () => {
                try {
                  const response = await dispatch(getSubTask(id)).unwrap();
                  setsubTask(response);
                } catch (err) {
                  console.log("Failed to fetch task details");
                  }
                  };
                fetchsubTask();
                 }, [dispatch, id]);

  if (loading) return <Loading />;
  if (error) return <p>Error: {error}</p>;


  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle file upload
  const handleUpload = async () => {
    const user_id = JSON.parse(localStorage.getItem('userInfo'))?._id  
    
    if (!file) {
      setMessage('Please select a file before uploading.');
      return;
    }

    if (!task_id || !user_id) {
      setMessage('Task ID and User ID are required.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', task_id);
    formData.append('userId', user_id);

    try {
      setMessage('Uploading...');

      // httpPostService returns parsed data (not full response)
      const result = await httpPostService('api/uploads/upload', formData, { headers: {} });

      setMessage('File uploaded successfully');
      // refresh upload list
      try {
        const latest = await httpGetService(`api/uploads/getuploads/${task_id}`);
        setgetfile(Array.isArray(latest) ? latest : latest?.data || []);
      } catch (e) {
        // ignore refresh errors
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage(error?.message || 'Internal Server Error');
    }
  };



  return (
    <div className='w-full flex flex-col gap-3 mb-4 overflow-y-hidden'>
<h1 className="font-bold">
  <span className="text-2xl text-gray-600">{task?.title}</span> -{" "}
  <span className="text-sm text-green-600">{task?.client_name}</span>
</h1>


      <Tabs tabs={TABS} setSelected={setSelected}>
        {selected === 0 ? (
          <>
            <div className='w-full flex flex-col md:flex-row gap-5 2xl:gap-8 bg-white shadow-md p-8 overflow-y-auto'>
              {/* LEFT */}
              <div className='w-full md:w-1/2 space-y-8'>
                <div className='flex items-center gap-5'>
                  <div
                    className={clsx(
                      "flex gap-1 items-center text-base font-semibold px-3 py-1 rounded-full",
                      PRIOTITYSTYELS[task?.priority],
                      bgColor[task?.priority]
                    )}
                  >
                    <span className='text-lg'>{ICONS[task?.priority]}</span>
                    <span className='uppercase'>{task?.priority} Priority</span>
                  </div>

                  <div className={clsx("flex items-center gap-2")}>
                    <div
                      className={clsx(
                        "w-4 h-4 rounded-full",
                        TASK_TYPE[task.stage]
                      )}
                    />
                    <span className='text-black uppercase'>{task?.stage}</span>
                  </div>
                </div>

                <p className='text-gray-500'>
                  Created At: {new Date(task?.createdAt).toDateString()}
                </p>

                <div className='flex items-center gap-8 p-4 border-y border-gray-200'>
                  <div className='space-x-2'>
                    <span className='font-semibold'>Time-Alotted :</span>
                    {/* <span>{assets?.length}</span> */}
                    <span>{task?.time_alloted}</span>
                    {/* <span>{assets?.length}</span> */}
                  </div>

                  <span className='text-gray-400'>|</span>

                  <div className='space-x-2'>
                    <span className='font-semibold'>Sub-Task :</span>
                    <span>{subtasks?.length}</span>
                  </div>

                  <span className='text-gray-400'>|</span>

                  <div className='space-x-2'>
                    <span className='font-semibold'>Time-Taken :</span>
                    <span>{totalWorkingHours}</span>
                  </div>
                </div>


                <div className='space-y-4 py-6'>
                  <p className='text-gray-600 font-semibold test-sm'>
                    TASK TEAM
                  </p>
                  <div className='space-y-3'>
                    {task?.assigned_users?.map((m, index) => (
                      <div
                        key={index}
                        className='flex gap-4 py-2 items-center border-t border-gray-200'
                      >
                        <div
                          className={
                            "w-10 h-10 rounded-full text-white flex items-center justify-center text-sm -mr-1 bg-blue-600"
                          }
                        >
                          <span className='text-center'>
                            {getInitials(m?.user_name)}
                          </span>
                        </div>

                        <div>
                          <p className='text-lg font-semibold'>{m?.user_name}</p>
                          <span className='text-gray-500'>{m?.user_role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>



                <div className='space-y-4 py-6'>
                  <p className='text-gray-500 font-semibold text-sm'>
                    SUB-TASKS
                  </p>
                  <div className='space-y-8'>
                    
                    {subtasks?.map((el, index) => (
                      <div key={index} className='flex gap-3'>
                        <div className='w-10 h-10 flex items-center justify-center rounded-full bg-violet-50-200'>
                          <MdTaskAlt className='text-violet-600' size={26} />
                        </div>

                        <div className='space-y-1'>
                          <div className='flex gap-2 items-center'>
                            <span className='text-sm text-gray-500'>
                              {new Date(el?.due_date).toDateString()}
                            </span>

                            <span className='px-2 py-0.5 text-center text-sm rounded-full bg-violet-100 text-violet-700 font-semibold'>
                              {el?.tag}
                            </span>
                          </div>

                          <p className='text-gray-700'>{el?.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* RIGHT */}
              <div className="w-full md:w-1/2 space-y-8">
  {/* Section Title */}

  {/* Task Description */}
  <div className="w-full">
    <div className="mb-4 text-gray-700">
      <p className="text-lg font-semibold">TASK DESCRIPTION</p>
      <p>{task?.description || "No description provided."}</p>
    </div>
    
    <div className="flex flex-col items-center justify-center bg-gray-100 p-4 rounded-lg shadow-md max-w-md mx-auto mt-10">
  <h2 className="text-xl font-bold text-gray-700 mb-3">Upload Your File</h2>
  <div className="flex items-center justify-between w-full space-x-4">
    <label
      htmlFor="file-input"
      className="flex flex-col items-center justify-center w-2/3 h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-100"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10 text-gray-400 mb-1"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span className="text-xs text-gray-500">Click to upload or drag files</span>
    </label>
    <input
      id="file-input"
      type="file"
      onChange={handleFileChange}
      className="hidden"
    />
    <button
      onClick={handleUpload}
      className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
    >
      Upload
    </button>
  </div>
  <p className="mt-3 text-sm text-gray-500">{message}</p>
</div>


    {/* Image Grid */}
    <p className="text-lg font-semibold">ASSETS</p>
{/* 
    <div className="mt-6">
      <h3 className="text-xl font-bold text-gray-700">Uploaded Files</h3>
      <p className="text-sm text-gray-500">{message}</p>

      {getfile.length > 0 ? (
        <div className="space-y-4 mt-4">
          {getfile.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm">
              <div>
                <p className="font-semibold text-gray-700">{file.file_name}</p>
                <p className="text-sm text-gray-500">{file.file_type}</p>
                <p className="text-sm text-gray-500">{(file.file_size / 1024).toFixed(2)} KB</p>
              </div>
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mt-4">No files uploaded for this task.</p>
      )}
    </div> */}

<div className="mt-6">
  <h3 className="text-xl font-bold text-gray-700">Uploaded Files</h3>
  <p className="text-sm text-gray-500">{message}</p>

{getfile && getfile.length > 0    ? ( <div className="space-y-4 mt-4">
      {getfile.map((file) => (
        <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm">
          <div className="flex flex-col">
            <p className="font-semibold text-gray-700">{file.file_name}</p>
            <p className="text-sm text-gray-500">{file.file_type}</p>
            <p className="text-sm text-gray-500">{(file.file_size / 1024).toFixed(2)} KB</p>

            {/* Preview for image files */}
            {file.file_type.startsWith('image') && (
              <div className="mt-2">
                <img 
                  src={file.file_url} 
                  alt={file.file_name} 
                  className="w-32 h-32 object-cover rounded-md" 
                />
              </div>
            )}
          </div>  

          <a
            href={file.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            Download
          </a>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-gray-500 mt-4">No files uploaded for this task.</p>
  )}
</div>




    <div className="grid grid-cols-2 gap-4">
      {assets?.map((el, index) => (
        <img
          key={index}
          src={el}
          alt={task?.title}
          className="w-full rounded h-28 md:h-36 2xl:h-52 cursor-pointer transition-all duration-700 hover:scale-125 hover:z-50"
        />
      ))}
    </div>
  </div>
</div>


            </div>
          </>
        ) : (
          <Activities activity={Activitiesdata} taskId={id} />
        )}
      </Tabs>
    </div>
  );
};



const Activities = ({ activity, taskId}) => {
  const [selected, setSelected] = useState(act_types[0]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      const user_id = JSON.parse(localStorage.getItem('userInfo'))?._id;
      if (!user_id) {
        setError("User not logged in or user ID missing.");
        return;
      }

      setIsLoading(true);
      setError(null);

      const result = await httpPostService('api/tasks/taskdetail/Postactivity', {
        task_id: taskId,
        user_id: user_id,
        type: selected,
        activity: text,
      });

      // Reset form
      setText("");
      setSelected(act_types[0]); 

    } catch (err) {
      console.error("Error submitting activity:", err);
      setError("Failed to submit activity");
    } finally {
      setIsLoading(false);
    }
  };

  const Card = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = () => {
      setIsExpanded(prevState => !prevState);
    };

    return (
      <div
        className='flex space-x-4 p-4 border rounded-lg shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl cursor-pointer'
        onClick={handleToggle}
      >
        <div className='flex flex-col items-center flex-shrink-0'>
          <div className='w-10 h-10 flex items-center justify-center'>
            {TASKTYPEICON[item?.type]}
          </div>
          <div className='w-full flex items-center'>
            <div className='w-0.5 bg-gray-300 h-full'></div>
          </div>
        </div>

        <div className='flex flex-col gap-y-1 mb-8'>
          <div className='flex items-center space-x-2'>
            <User size={16} />
            <p className='font-semibold'>{item?.user_name}</p>
          </div>

          <div className='text-gray-500 space-y-2'>
            <span className='capitalize'>{item?.type}</span>
            <div className='flex items-center space-x-2'>
              <Clock size={18} />
              <span className='text-sm'>{moment(item?.createdAt).fromNow()}</span>
            </div>
          </div>

          <div className='text-gray-700'>
            {isExpanded ? (
              item?.activity
            ) : (
              item?.activity?.slice(0, 30) + '...'
            )}
          </div>
        </div>

        <div className='flex flex-col items-center justify-center mt-4 gap-y-2'>
          <button className='text-blue-500 hover:underline'>
            {isExpanded ? 'Less' : 'More...'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className='w-full flex gap-10 2xl:gap-20 min-h-screen px-10 py-8 bg-white shadow rounded-md justify-between overflow-y-auto'>
      <div className='w-full md:w-1/2'>
        <h4 className='text-gray-600 font-semibold text-lg mb-5'>Activities</h4>

        <div className='w-full'>
          {activity?.map((el, index) => (
            <Card key={index} item={el} />
          ))}
        </div>
      </div>

      <div className='w-full md:w-1/3'>
        <h4 className='text-gray-600 font-semibold text-lg mb-5'>
          Add Activity
        </h4>
        <div className='w-full flex flex-wrap gap-5'>
          {act_types.map((item) => (
            <div key={item} className='flex gap-2 items-center'>
              <input
                type='radio'
                className='w-4 h-4'
                checked={selected === item}
                onChange={() => setSelected(item)} // Only one activity type can be selected at a time
              />
              <p>{item}</p>
            </div>
          ))}
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Type activity details...'
            className='bg-white w-full mt-10 border border-gray-300 outline-none p-4 rounded-md focus:ring-2 ring-blue-500'
          ></textarea>
          {isLoading ? (
            <Loading />
          ) : (
            <Button
              type='button'
              label='Submit'
              onClick={handleSubmit}
              className='bg-blue-600 text-white rounded'
            />
          )}
          {error && <p className='text-red-500'>{error}</p>}
        </div>
      </div>
    </div>
  );
};


export default TaskDetails;