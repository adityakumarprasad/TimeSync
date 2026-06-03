import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Tasks from './Tasks';
import Timer from './Timer';
import Summary from './Summary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutGrid, Clock, ClipboardList, BarChart3, User } from 'lucide-react';
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
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden flex flex-col font-sans">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[40%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[40%] rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center border border-violet-400/10 shadow shadow-violet-500/10">
              <Clock className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              TaskSync
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 rounded-full py-1 px-3">
              <div className="w-5 h-5 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <User className="w-3 h-3" />
              </div>
              <span className="text-xs text-zinc-300 font-medium">@{user?.username}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-zinc-400 hover:text-red-400 hover:bg-red-500/5 cursor-pointer flex items-center gap-2 py-2 px-3 border border-transparent hover:border-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <Card className="border-zinc-900 bg-zinc-900/10 backdrop-blur-xl p-4 md:sticky md:top-24">
            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer w-full text-left flex-shrink-0 md:flex-shrink ${
                  activeTab === 'tasks'
                    ? 'bg-violet-600/10 text-violet-400 border-l-2 border-violet-500'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Tasks Directory
              </button>

              <button
                onClick={() => setActiveTab('timer')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer w-full text-left flex-shrink-0 md:flex-shrink relative ${
                  activeTab === 'timer'
                    ? 'bg-violet-600/10 text-violet-400 border-l-2 border-violet-500'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Clock className="w-4 h-4" />
                Time Tracker
                {runningTaskId && (
                  <span className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('summary')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer w-full text-left flex-shrink-0 md:flex-shrink ${
                  activeTab === 'summary'
                    ? 'bg-violet-600/10 text-violet-400 border-l-2 border-violet-500'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Daily Summary
              </button>
            </nav>
          </Card>
        </aside>

        {/* Workspace views */}
        <section className="flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-8 h-8 border-2 border-t-transparent border-violet-500 rounded-full animate-spin" />
              <span className="text-zinc-500 text-sm">Syncing roadmap details...</span>
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
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
