import express from 'express';
import TimeLog from '../models/TimeLog.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply protection
router.use(protect);

// @route   GET /api/timelogs
// @desc    Get all time logs for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const logs = await TimeLog.find({ userId: req.user._id })
      .populate('taskId', 'title description status')
      .sort({ startTime: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Server error retrieving logs' });
  }
});

// @route   GET /api/timelogs/today
// @desc    Get summary for the current day
// @access  Private
router.get('/today', async (req, res) => {
  try {
    // Start and end of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Fetch all tasks for the user
    const userTasks = await Task.find({ userId: req.user._id });
    
    // Status counts
    const completedTasksCount = userTasks.filter(t => t.status === 'Completed').length;
    const pendingTasksCount = userTasks.filter(t => t.status === 'Pending').length;
    const inProgressTasksCount = userTasks.filter(t => t.status === 'In Progress').length;

    // 2. Fetch today's time logs
    const todayLogs = await TimeLog.find({
      userId: req.user._id,
      startTime: { $gte: startOfToday, $lte: endOfToday }
    }).populate('taskId', 'title description status');

    // Calculate total time tracked today (in seconds)
    const totalDurationToday = todayLogs.reduce((acc, log) => acc + log.duration, 0);

    // Find unique tasks worked on today (based on logs)
    const tasksWorkedOnMap = {};
    todayLogs.forEach(log => {
      if (log.taskId) {
        const tId = log.taskId._id.toString();
        if (!tasksWorkedOnMap[tId]) {
          tasksWorkedOnMap[tId] = {
            _id: log.taskId._id,
            title: log.taskId.title,
            description: log.taskId.description,
            status: log.taskId.status,
            timeTracked: 0
          };
        }
        tasksWorkedOnMap[tId].timeTracked += log.duration;
      }
    });

    // Also include any currently running tasks today in the worked-on list
    const runningTasks = userTasks.filter(t => t.timerStartedAt !== null);
    runningTasks.forEach(task => {
      const tId = task._id.toString();
      if (!tasksWorkedOnMap[tId]) {
        tasksWorkedOnMap[tId] = {
          _id: task._id,
          title: task.title,
          description: task.description,
          status: task.status,
          timeTracked: 0,
          isRunning: true,
          timerStartedAt: task.timerStartedAt
        };
      } else {
        tasksWorkedOnMap[tId].isRunning = true;
        tasksWorkedOnMap[tId].timerStartedAt = task.timerStartedAt;
      }
    });

    const tasksWorkedOn = Object.values(tasksWorkedOnMap);

    res.json({
      summary: {
        totalDurationToday,
        completedTasksCount,
        pendingTasksCount,
        inProgressTasksCount,
        totalTasksCount: userTasks.length
      },
      todayLogs,
      tasksWorkedOn
    });
  } catch (error) {
    console.error('Error fetching today summary:', error);
    res.status(500).json({ message: 'Server error retrieving daily summary' });
  }
});

// @route   DELETE /api/timelogs/:id
// @desc    Delete a specific time log
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const log = await TimeLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: 'Time log not found' });
    }

    if (log.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await TimeLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Time log deleted' });
  } catch (error) {
    console.error('Error deleting time log:', error);
    res.status(500).json({ message: 'Server error deleting time log' });
  }
});

export default router;
