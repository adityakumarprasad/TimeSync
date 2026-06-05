import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Square, Calendar, ArrowRight, Trash2, Copy } from 'lucide-react';

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

  // Helper: Format seconds to HH : MM : SS format with spaces
  const formatTimeStr = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(' : ');
  };

  // Helper: Pretty format seconds to readable string
  const formatDurationFriendly = (totalSeconds) => {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  };

  // Helper: Format Date String
  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Copy all logs to clipboard helper
  const handleCopyLogs = () => {
    if (timeLogs.length === 0) return;
    const text = timeLogs
      .map(
        (log) =>
          `${log.taskId ? log.taskId.title : 'Deleted Task'}: ${formatDateTime(
            log.startTime
          )} - ${new Date(log.endTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })} (${formatDurationFriendly(log.duration)})`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    alert('Session logs copied to clipboard!');
  };

  // Aggregate time spent on EACH task
  const getTaskAggregations = () => {
    const aggregates = {};
    
    // Seed with all current tasks
    tasks.forEach(t => {
      aggregates[t._id] = {
        _id: t._id,
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
          aggregates[tId] = {
            _id: tId,
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
    <div className="flex flex-col gap-8">
      {/* Active Clock Banner */}
      <div className="shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl bg-emerald-50/40 border border-emerald-500/20 flex p-8 justify-between items-center">
        <div className="flex items-center gap-6">
          <div className={`size-20 shadow-[0_0_20px_rgba(16,185,129,0.2)] rounded-full bg-white border border-emerald-500/30 flex justify-center items-center ${
            runningTask ? 'animate-pulse' : ''
          }`}>
            <Clock className="size-9 text-emerald-500" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-slate-900 text-2xl leading-8">
              {runningTask ? 'Active Session' : 'No Active Session'}
            </h2>
            <p className={`font-semibold text-base leading-6 ${runningTask ? 'text-emerald-600' : 'text-slate-500'}`}>
              {runningTask ? runningTask.title : 'Select start timer on any task in the directory to begin tracking.'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-4">
          <span className="bg-[linear-gradient(135deg,#059669,#10B981)] bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(16,185,129,0.15)] font-mono font-bold text-5xl leading-12 tracking-wider">
            {formatTimeStr(elapsed)}
          </span>
          {runningTask && (
            <button 
              onClick={() => onStopTimer(runningTask._id)}
              className="shadow-[0_4px_12px_rgba(220,38,38,0.2)] font-semibold rounded-lg bg-red-600 text-white text-sm leading-5 flex px-6 py-2.5 items-center gap-2 hover:bg-red-700 cursor-pointer transition-colors"
            >
              <Square className="size-4 fill-current" />
              <span>Stop Timer</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Time Per Task */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-slate-900 text-xl leading-7">
              Time Per Task
            </h3>
            <p className="text-slate-500 text-sm leading-5">
              Total cumulative minutes tracked per task.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            {taskAggs.length === 0 ? (
              <div className="rounded-xl bg-white border border-slate-200 p-6 text-center text-slate-400 text-sm">
                No time has been logged yet.
              </div>
            ) : (
              taskAggs.map((agg, idx) => (
                <div key={idx} className="rounded-xl bg-white border border-slate-200 flex p-4 justify-between items-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <div className="min-w-0 flex flex-col gap-2">
                    <span className="truncate max-w-[220px] font-medium text-slate-900 text-sm leading-5">
                      {agg.title}
                    </span>
                    {agg.status === 'Completed' && (
                      <span className="rounded-full bg-emerald-50 text-emerald-700 text-xs leading-4 border border-emerald-200 px-2 py-0.5 w-fit font-semibold">
                        Completed
                      </span>
                    )}
                    {agg.status === 'In Progress' && (
                      <span className="rounded-full bg-sky-50 text-sky-700 text-xs leading-4 border border-sky-200 px-2 py-0.5 w-fit font-semibold">
                        In Progress
                      </span>
                    )}
                    {agg.status === 'Pending' && (
                      <span className="rounded-full bg-amber-50 text-amber-700 text-xs leading-4 border border-amber-200 px-2 py-0.5 w-fit font-semibold">
                        Pending
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 font-bold text-emerald-600 text-base leading-6">
                    {formatDurationFriendly(agg.totalSeconds)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Session Log History */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-slate-900 text-xl leading-7">
                Session Log History
              </h3>
              <p className="text-slate-500 text-sm leading-5">
                Detailed records of all recorded sessions.
              </p>
            </div>
            <button 
              onClick={handleCopyLogs}
              className="text-slate-400 hover:text-slate-800 cursor-pointer transition-colors p-1"
              title="Copy session logs to clipboard"
            >
              <Copy className="size-5" />
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {timeLogs.length === 0 ? (
                <div className="rounded-xl bg-white border border-slate-200 p-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <Calendar className="size-10 text-slate-300" />
                  <span>No tracking sessions logged yet.</span>
                </div>
              ) : (
                timeLogs.map((log) => (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-xl bg-white border border-slate-200 flex p-4 justify-between items-center gap-4 hover:border-slate-300 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                  >
                    <div className="min-w-0 flex flex-col gap-2">
                      <span className="truncate font-bold text-slate-800 text-sm leading-5">
                        {log.taskId ? log.taskId.title : 'Deleted Task'}
                      </span>
                      <div className="text-slate-400 text-xs leading-4 flex items-center gap-2">
                        <Calendar className="size-3.5" />
                        <span>{formatDateTime(log.startTime)}</span>
                        <ArrowRight className="size-3" />
                        <span>{new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      <span className="font-bold rounded-md bg-emerald-50 text-emerald-700 text-xs leading-4 border border-emerald-200 px-2.5 py-1">
                        {formatDurationFriendly(log.duration)}
                      </span>
                      <button 
                        onClick={() => handleDeleteLog(log._id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer p-1 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;
