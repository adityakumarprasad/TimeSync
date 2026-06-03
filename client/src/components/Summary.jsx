import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Summary = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const summaryData = await api.timeLogs.getTodaySummary();
      setData(summaryData);
    } catch (error) {
      console.error('Failed to load daily summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    
    // Auto-update if there is an active running timer on this view
    const interval = setInterval(() => {
      if (data?.tasksWorkedOn?.some(t => t.isRunning)) {
        fetchSummary();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
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

  // Format seconds to readable format
  const formatDurationStr = (seconds) => {
    if (seconds === 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  // SVG Circular progress constants
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Daily Productivity Summary</h2>
        <p className="text-zinc-400 text-sm">Review your accomplishments and tracked time for today.</p>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-zinc-500 text-xs font-medium">Time Tracked Today</span>
              <h3 className="text-2xl font-bold text-white font-mono">{formatDurationStr(summary.totalDurationToday)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-zinc-500 text-xs font-medium">Completed Tasks</span>
              <h3 className="text-2xl font-bold text-white font-mono">{summary.completedTasksCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-zinc-500 text-xs font-medium">Active Tasks</span>
              <h3 className="text-2xl font-bold text-white font-mono">{summary.inProgressTasksCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <PlayCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-zinc-500 text-xs font-medium">Pending Tasks</span>
              <h3 className="text-2xl font-bold text-white font-mono">{summary.pendingTasksCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Productivity Ring */}
        <Card className="border-zinc-800 bg-zinc-900/20 backdrop-blur-sm flex flex-col justify-center items-center p-6 text-center">
          <CardHeader className="p-0 mb-4 w-full text-left font-bold">
            <CardTitle className="text-lg text-white font-bold tracking-tight">Goal Progress</CardTitle>
            <CardDescription className="text-zinc-500 text-xs">Completion rate of all items on your roadmap.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center w-full">
            <div className="relative flex items-center justify-center w-36 h-36">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  className="text-zinc-800"
                  strokeWidth={stroke}
                  stroke="currentColor"
                  fill="transparent"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                {/* Foreground Progress Ring */}
                <motion.circle
                  className="text-violet-500"
                  strokeWidth={stroke}
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
              </svg>
              {/* Inner Label */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white font-mono">{completionRate}%</span>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Done</span>
              </div>
            </div>

            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400 font-light">
                <span>{completedTasks} of {totalTasks} objectives finalized</span>
                <span>{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="bg-zinc-800 h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Worked tasks list today */}
        <Card className="border-zinc-800 bg-zinc-900/20 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b border-zinc-800/60">
            <CardTitle className="text-lg text-white font-bold tracking-tight">Today's Activity Log</CardTitle>
            <CardDescription className="text-zinc-500 text-xs">Tasks you dedicated focus to or active timers running today.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {tasksWorkedOn.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 text-sm">
                  No activity recorded today. Select a task to start tracking.
                </div>
              ) : (
                tasksWorkedOn.map((task) => (
                  <div key={task._id} className="flex items-center justify-between border-b border-zinc-800/40 pb-3 last:border-b-0 last:pb-0">
                    <div className="space-y-1 max-w-[70%]">
                      <h4 className="text-sm font-semibold text-zinc-200 truncate">{task.title}</h4>
                      <p className="text-xs text-zinc-500 font-light truncate max-w-md">{task.description || 'No description provided'}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {task.isRunning && (
                        <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 animate-pulse">
                          Tracking Live
                        </span>
                      )}
                      <span className="text-sm font-bold font-mono text-violet-400 bg-violet-500/5 px-2.5 py-1 rounded border border-violet-500/10">
                        {formatDurationStr(task.timeTracked)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Summary;
