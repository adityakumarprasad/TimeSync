import { useState, useEffect } from 'react';
import api from '../services/api';
import { Clock, CheckCircle2, AlertCircle, PlayCircle, Loader2, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Summary = () => {
  const [data, setData] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const [summaryData, logsData] = await Promise.all([
        api.timeLogs.getTodaySummary(),
        api.timeLogs.getAll()
      ]);
      setData(summaryData);
      setAllLogs(logsData);
    } catch (error) {
      console.error('Failed to load daily summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Auto-refresh if a timer is running
  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      if (data?.tasksWorkedOn?.some(t => t.isRunning)) {
        fetchSummary();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 bg-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const { summary, tasksWorkedOn } = data || {
    summary: { totalDurationToday: 0, completedTasksCount: 0, pendingTasksCount: 0, inProgressTasksCount: 0, totalTasksCount: 0 },
    tasksWorkedOn: []
  };

  const totalTasks = summary.totalTasksCount;
  const completedTasks = summary.completedTasksCount;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Format seconds to readable format (e.g. 2h 14m)
  const formatDurationStr = (seconds) => {
    if (seconds === 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const getTodayDateStr = () => {
    return new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Compute Weekly Trend dynamically from last 7 days of logs
  const getWeeklyTrend = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend = [];
    
    // Last 7 days, ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      const end = dEnd.getTime();
      
      let totalSec = 0;
      allLogs.forEach(log => {
        const logTime = new Date(log.startTime).getTime();
        if (logTime >= start && logTime <= end) {
          totalSec += log.duration;
        }
      });
      
      trend.push({
        dayName: days[d.getDay()],
        duration: totalSec
      });
    }
    
    const maxSec = Math.max(...trend.map(t => t.duration), 1);
    return trend.map(t => ({
      ...t,
      heightPct: Math.round((t.duration / maxSec) * 100)
    }));
  };

  const weeklyTrendData = getWeeklyTrend();

  return (
    <div className="flex flex-col gap-8 bg-white text-slate-900">
      {/* Header section */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-slate-900 text-3xl leading-9 tracking-tight">
            Daily Productivity Summary
          </h1>
          <p className="text-slate-500 text-sm leading-5">
            Review your accomplishments and tracked time for today.
          </p>
        </div>
        <div className="rounded-full bg-emerald-50 border border-emerald-200/50 flex px-3 py-1.5 items-center gap-2">
          <Calendar className="size-3.5 text-emerald-600" />
          <span className="font-medium text-emerald-700 text-sm leading-5">
            {getTodayDateStr()}
          </span>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="shadow-md shadow-slate-100 rounded-xl bg-white border border-slate-200 flex p-6 justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-xs leading-4">
              Time Tracked Today
            </span>
            <span className="font-bold text-slate-900 text-2xl leading-8">
              {formatDurationStr(summary.totalDurationToday)}
            </span>
          </div>
          <div className="size-11 rounded-lg bg-emerald-50 flex justify-center items-center">
            <Clock className="size-5 text-emerald-600" />
          </div>
        </div>

        <div className="shadow-md shadow-slate-100 rounded-xl bg-white border border-slate-200 flex p-6 justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-xs leading-4">
              Completed Tasks
            </span>
            <span className="font-bold text-slate-900 text-2xl leading-8">
              {summary.completedTasksCount}
            </span>
          </div>
          <div className="size-11 rounded-lg bg-emerald-50 flex justify-center items-center">
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
        </div>

        <div className="shadow-md shadow-slate-100 rounded-xl bg-white border border-slate-200 flex p-6 justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-xs leading-4">
              Active Tasks
            </span>
            <span className="font-bold text-slate-900 text-2xl leading-8">
              {summary.inProgressTasksCount}
            </span>
          </div>
          <div className="size-11 rounded-lg bg-sky-50 flex justify-center items-center">
            <PlayCircle className="size-5 text-sky-600" />
          </div>
        </div>

        <div className="shadow-md shadow-slate-100 rounded-xl bg-white border border-slate-200 flex p-6 justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-xs leading-4">
              Pending Tasks
            </span>
            <span className="font-bold text-slate-900 text-2xl leading-8">
              {summary.pendingTasksCount}
            </span>
          </div>
          <div className="size-11 rounded-lg bg-amber-50 flex justify-center items-center">
            <AlertCircle className="size-5 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Goal Progress */}
        <div className="shadow-md shadow-slate-100 rounded-xl bg-white border border-slate-200 flex p-6 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-slate-900 text-lg leading-7">
              Goal Progress
            </h2>
            <p className="text-slate-500 text-sm leading-5">
              Completion rate of all items on your roadmap.
            </p>
          </div>
          
          <div className="flex py-4 justify-center items-center">
            <div 
              className="relative size-52 rounded-full flex justify-center items-center transition-all duration-500"
              style={{
                background: `conic-gradient(from 0deg, #10b981 0deg, #059669 ${completionRate * 3.6}deg, #f1f5f9 ${completionRate * 3.6}deg, #f1f5f9 360deg)`
              }}
            >
              <div className="size-40 rounded-full bg-white flex flex-col justify-center items-center">
                <span className="font-bold text-slate-900 text-4xl leading-10">
                  {completionRate}%
                </span>
                <span className="font-medium text-slate-400 text-xs leading-4 tracking-widest mt-1">
                  DONE
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm leading-5 flex justify-between items-center">
              <span className="text-slate-600">
                {completedTasks} of {totalTasks} objectives finalized
              </span>
              <span className="font-semibold text-emerald-600">{completionRate}%</span>
            </div>
            <div className="rounded-full bg-slate-100 w-full h-2.5 overflow-hidden">
              <div 
                style={{ width: `${completionRate}%` }} 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full h-full transition-all duration-500" 
              />
            </div>
          </div>
        </div>

        {/* Right side flex layouts */}
        <div className="flex flex-col gap-6">
          {/* Today's Activity Log */}
          <div className="shadow-md shadow-slate-100 rounded-xl bg-white border border-slate-200 flex p-6 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-bold text-slate-900 text-lg leading-7">
                Today's Activity Log
              </h2>
              <p className="text-slate-500 text-sm leading-5">
                Tasks you dedicated focus to or active timers running today.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {tasksWorkedOn.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No activity recorded today. Select a task to start tracking.
                </div>
              ) : (
                tasksWorkedOn.map((task) => {
                  const pct = summary.totalDurationToday > 0 ? (task.timeTracked / summary.totalDurationToday) * 100 : 0;
                  return (
                    <div key={task._id} className="rounded-lg bg-slate-50 border border-slate-200 flex p-4 flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-sm leading-5 truncate max-w-[200px]">
                          {task.title}
                        </span>
                        {task.isRunning ? (
                          <span className="font-medium rounded-full bg-red-50 text-red-700 text-xs leading-4 border border-red-200 px-2.5 py-1 animate-pulse">
                            Tracking Live
                          </span>
                        ) : task.status === 'Completed' ? (
                          <span className="font-medium rounded-full bg-emerald-50 text-emerald-700 text-xs leading-4 border border-emerald-200 px-2.5 py-1">
                            Completed
                          </span>
                        ) : task.status === 'In Progress' ? (
                          <span className="font-medium rounded-full bg-blue-50 text-blue-700 text-xs leading-4 border border-blue-200 px-2.5 py-1">
                            In Progress
                          </span>
                        ) : (
                          <span className="font-medium rounded-full bg-amber-50 text-amber-700 text-xs leading-4 border border-amber-200 px-2.5 py-1">
                            Pending
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="relative rounded-full bg-slate-200 mr-4 flex-1 h-1.5 overflow-hidden">
                          <div 
                            style={{ width: `${pct}%` }} 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          />
                        </div>
                        <span className="font-bold text-emerald-600 text-sm leading-5 shrink-0">
                          {formatDurationStr(task.timeTracked)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Weekly Trend Bar Chart */}
          <div className="shadow-md shadow-slate-100 rounded-xl bg-white border border-slate-200 flex p-6 flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="font-bold text-slate-900 text-base leading-6">
                  Weekly Trend
                </h2>
                <p className="text-slate-500 text-xs leading-4">
                  Daily productivity for the past 7 days.
                </p>
              </div>
              <TrendingUp className="size-5 text-emerald-500" />
            </div>

            <div className="flex pt-2 justify-between items-end gap-3 h-32">
              {weeklyTrendData.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 gap-2 h-full justify-end">
                  <div 
                    style={{ height: `${Math.max(day.heightPct, 5)}%` }} 
                    className="rounded-t-md bg-emerald-500/70 w-full hover:bg-emerald-600 transition-all cursor-pointer"
                    title={`${day.dayName}: ${formatDurationStr(day.duration)}`}
                  />
                  <span className="text-slate-400 text-xs leading-4">
                    {day.dayName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
