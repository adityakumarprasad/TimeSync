import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Tasks from './Tasks';
import Timer from './Timer';
import Summary from './Summary';
import { LogOut, Clock, CheckSquare, BarChart3, User } from 'lucide-react';
import { RiTimerFlashLine } from 'react-icons/ri';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const data = await api.tasks.getAll();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchTimeLogs = async () => {
    try {
      const data = await api.timeLogs.getAll();
      setTimeLogs(data);
    } catch (error) {
      console.error('Failed to fetch time logs:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchTasks(), fetchTimeLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartTimer = async (id) => {
    try {
      await api.tasks.startTimer(id);
      await fetchData();
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handleStopTimer = async (id) => {
    try {
      await api.tasks.stopTimer(id);
      await fetchData();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  // Find if there is an active running timer
  const runningTask = tasks.find(t => t.timerStartedAt !== null) || null;
  const runningTaskId = runningTask ? runningTask._id : null;

  return (
    <div className="bg-white text-slate-900 w-full min-h-screen flex flex-col overflow-visible font-sans">
      {/* Header bar */}
      <div className="border-slate-200 border-b flex px-8 justify-between items-center h-16 shrink-0 z-50 bg-white">
        <div className="flex items-center gap-2">
          <div className="size-9 bg-[linear-gradient(135deg,#10B981,#059669)] shadow-[0_0_15px_rgba(16,185,129,0.3)] rounded-xl flex justify-center items-center">
            <RiTimerFlashLine className="size-5.5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-xl leading-7 tracking-tight">
            TaskSync
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-slate-50 border-slate-200 border flex px-3 py-1.5 items-center gap-2">
            <div className="size-6 bg-[linear-gradient(135deg,#10B981,#059669)] rounded-full flex justify-center items-center">
              <User className="size-3.5 text-white" />
            </div>
            <span className="text-slate-700 text-sm font-medium leading-5">@{user?.username || 'adi'}</span>
          </div>
          <button 
            onClick={logout}
            className="text-slate-500 text-sm leading-5 flex items-center gap-2 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main split: Sidebar + Content */}
      <div className="flex flex-1 w-full">
        <aside className="shrink-0 min-h-[884px] bg-slate-50 p-6 w-64 border-r border-slate-200 flex flex-col gap-2">
          <nav className="flex flex-col justify-start items-stretch gap-2">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`rounded-lg flex px-4 py-3 items-center gap-3 w-full text-left cursor-pointer transition-all ${
                activeTab === 'tasks'
                  ? 'relative bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600 font-semibold text-sm leading-5'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm leading-5'
              }`}
            >
              <CheckSquare className="size-5" />
              <span>Tasks Directory</span>
            </button>

            <button
              onClick={() => setActiveTab('timer')}
              className={`rounded-lg flex px-4 py-3 items-center gap-3 w-full text-left cursor-pointer transition-all relative ${
                activeTab === 'timer'
                  ? 'relative bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600 font-semibold text-sm leading-5'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm leading-5'
              }`}
            >
              <Clock className="size-5" />
              <span>Time Tracker</span>
              {runningTaskId && (
                <span className="absolute right-4 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`rounded-lg flex px-4 py-3 items-center gap-3 w-full text-left cursor-pointer transition-all ${
                activeTab === 'summary'
                  ? 'relative bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600 font-semibold text-sm leading-5'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm leading-5'
              }`}
            >
              <BarChart3 className="size-5" />
              <span>Daily Summary</span>
            </button>
          </nav>
        </aside>

        {/* View container */}
        <main className="flex-1 p-8 overflow-auto min-h-0 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-8 h-8 border-2 border-t-transparent border-emerald-500 rounded-full animate-spin" />
              <span className="text-slate-500 text-sm">Syncing roadmap details...</span>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'tasks' && (
                <Tasks
                  tasks={tasks}
                  fetchTasks={fetchTasks}
                  runningTaskId={runningTaskId}
                  onStartTimer={handleStartTimer}
                  onStopTimer={handleStopTimer}
                />
              )}
              {activeTab === 'timer' && (
                <Timer
                  tasks={tasks}
                  timeLogs={timeLogs}
                  fetchTasks={fetchTasks}
                  fetchTimeLogs={fetchTimeLogs}
                  runningTask={runningTask}
                  onStopTimer={handleStopTimer}
                />
              )}
              {activeTab === 'summary' && <Summary />}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
