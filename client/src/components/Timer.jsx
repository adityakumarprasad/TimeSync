import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Clock, Trash2, Calendar, FileText, CheckCircle } from 'lucide-react';

const Timer = ({ tasks, timeLogs, fetchTasks, fetchTimeLogs, runningTask, onStopTimer }) => {
  const [elapsed, setElapsed] = useState(0);

  // Active timer ticker logic
  useEffect(() => {
    let interval = null;

    if (runningTask && runningTask.timerStartedAt) {
      const calculateElapsed = () => {
        const start = new Date(runningTask.timerStartedAt).getTime();
        const now = Date.now();
        setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
      };

      // Set initial elapsed
      calculateElapsed();

      interval = setInterval(calculateElapsed, 1000);
    } else {
      setElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [runningTask]);

  const handleDeleteLog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this time log?')) return;
    try {
      await api.timeLogs.deleteLog(id);
      fetchTimeLogs();
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete time log:', error);
    }
  };

  // Helper: Format seconds to HH:MM:SS
  const formatTimeStr = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  // Helper: Pretty format seconds to readable string
  const formatDurationFriendly = (totalSeconds) => {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}h ${min}m`;
  };

  // Helper: Format Date String
  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Aggregate time spent on EACH task
  const getTaskAggregations = () => {
    const aggregates = {};
    
    // Seed with all current tasks
    tasks.forEach(t => {
      aggregates[t._id] = {
        title: t.title,
        status: t.status,
        totalSeconds: 0
      };
    });

    // Sum time logs
    timeLogs.forEach(log => {
      if (log.taskId) {
        const tId = typeof log.taskId === 'object' ? log.taskId._id : log.taskId;
        if (aggregates[tId]) {
          aggregates[tId].totalSeconds += log.duration;
        } else {
          // If task was deleted but log remains
          aggregates[tId] = {
            title: log.taskId.title || 'Deleted Task',
            status: 'Deleted',
            totalSeconds: log.duration
          };
        }
      }
    });

    return Object.values(aggregates).filter(agg => agg.totalSeconds > 0 || (runningTask && runningTask._id === agg._id));
  };

  const taskAggs = getTaskAggregations();

  return (
    <div className="space-y-6">
      {/* Active Clock Banner */}
      <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-xl relative overflow-hidden shadow-xl shadow-black/20">
        <div className="absolute top-[-10%] right-[-10%] w-[30%] h-[50%] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
            <div className={`p-4 rounded-full ${
              runningTask ? 'bg-red-500/10 border border-red-500/20 text-red-400 animate-pulse' : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
            }`}>
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {runningTask ? 'Session Timer Active' : 'No Active Session'}
              </h3>
              <p className="text-zinc-400 text-sm mt-0.5">
                {runningTask ? (
                  <>Currently working on: <span className="text-violet-400 font-semibold">{runningTask.title}</span></>
                ) : (
                  'Select start timer on any task in the directory to begin tracking.'
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className={`text-4xl md:text-5xl font-mono font-bold tracking-wider select-none ${
              runningTask ? 'text-violet-400 drop-shadow-[0_0_15px_rgba(167,139,250,0.25)]' : 'text-zinc-600'
            }`}>
              {formatTimeStr(elapsed)}
            </div>

            {runningTask && (
              <Button
                variant="destructive"
                onClick={() => onStopTimer(runningTask._id)}
                className="bg-red-600 hover:bg-red-500 text-white font-medium cursor-pointer shadow-lg shadow-red-600/15 flex items-center gap-2"
              >
                <Square className="w-4 h-4 fill-white" />
                Stop Tracking
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Total Time per Task Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-zinc-800/60">
              <CardTitle className="text-lg text-white font-bold tracking-tight">Time Per Task</CardTitle>
              <CardDescription className="text-zinc-500 text-xs">Total cumulative minutes tracked per task.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {taskAggs.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm">No time has been logged yet.</div>
                ) : (
                  taskAggs.map((agg, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-zinc-800/40 pb-2.5 last:border-b-0 last:pb-0">
                      <div className="max-w-[70%]">
                        <h4 className="text-sm font-semibold text-zinc-300 truncate">{agg.title}</h4>
                        <span className="text-[10px] text-zinc-500">{agg.status}</span>
                      </div>
                      <span className="text-sm font-semibold text-violet-400 font-mono">
                        {formatDurationFriendly(agg.totalSeconds)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Detailed Logs List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-zinc-800/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-white font-bold tracking-tight">Session Log History</CardTitle>
                <CardDescription className="text-zinc-500 text-xs">Detailed records of all recorded sessions.</CardDescription>
              </div>
              <FileText className="w-5 h-5 text-zinc-500" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {timeLogs.length === 0 ? (
                    <div className="text-center py-16 text-zinc-500 text-sm border border-dashed border-zinc-800/60 rounded-xl">
                      <Calendar className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                      No tracking sessions logged.
                    </div>
                  ) : (
                    timeLogs.map((log) => (
                      <motion.div
                        key={log._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        className="bg-zinc-950/40 border border-zinc-800/60 rounded-lg p-3.5 flex items-center justify-between gap-4 hover:border-zinc-800 transition-colors"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-zinc-200 truncate">
                            {log.taskId ? log.taskId.title : 'Deleted Task'}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 font-light">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDateTime(log.startTime)}
                            </span>
                            <span>→</span>
                            <span>{new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/10">
                            {formatDurationFriendly(log.duration)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLog(log._id)}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/5 cursor-pointer w-8 h-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Timer;
