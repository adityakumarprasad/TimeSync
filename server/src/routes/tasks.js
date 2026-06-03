import express from 'express';
import Task from '../models/Task.js';
import TimeLog from '../models/TimeLog.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// @route   GET /api/tasks
// @desc    Get all tasks for logged in user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error retrieving tasks' });
  }
});

// @route   POST /api/tasks
// @desc    Create a task
// @access  Private
router.post('/', async (req, res) => {
  const { title, description, status } = req.body;

  try {
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const task = await Task.create({
      userId: req.user._id,
      title,
      description,
      status: status || 'Pending',
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', async (req, res) => {
  const { title, description, status } = req.body;

  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Make sure task belongs to user
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.status = status || task.status;

    // If marked completed, and timer was running, stop it automatically
    if (status === 'Completed' && task.timerStartedAt) {
      const startTime = task.timerStartedAt;
      const endTime = new Date();
      const duration = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 1000));

      // Create log
      await TimeLog.create({
        userId: req.user._id,
        taskId: task._id,
        startTime,
        endTime,
        duration,
      });

      task.timerStartedAt = null;
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task & all its time logs
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Make sure task belongs to user
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete associated time logs
    await TimeLog.deleteMany({ taskId: task._id });
    
    // Delete task
    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task and associated time logs deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

// @route   POST /api/tasks/:id/start
// @desc    Start timer for a task
// @access  Private
router.post('/:id/start', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (task.timerStartedAt) {
      return res.status(400).json({ message: 'Timer is already running for this task' });
    }

    // 1. Stop any other running timers for this user to keep data integrity
    const runningTasks = await Task.find({
      userId: req.user._id,
      timerStartedAt: { $ne: null }
    });

    for (let runningTask of runningTasks) {
      const startTime = runningTask.timerStartedAt;
      const endTime = new Date();
      const duration = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 1000));

      // Save log
      await TimeLog.create({
        userId: req.user._id,
        taskId: runningTask._id,
        startTime,
        endTime,
        duration,
      });

      runningTask.timerStartedAt = null;
      await runningTask.save();
    }

    // 2. Start timer for this task
    task.timerStartedAt = new Date();
    task.status = 'In Progress';
    const updatedTask = await task.save();

    res.json(updatedTask);
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({ message: 'Server error starting timer' });
  }
});

// @route   POST /api/tasks/:id/stop
// @desc    Stop timer for a task & create a time log
// @access  Private
router.post('/:id/stop', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!task.timerStartedAt) {
      return res.status(400).json({ message: 'Timer is not running for this task' });
    }

    const startTime = task.timerStartedAt;
    const endTime = new Date();
    const duration = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 1000)); // duration in seconds

    // 1. Create a TimeLog
    const log = await TimeLog.create({
      userId: req.user._id,
      taskId: task._id,
      startTime,
      endTime,
      duration,
    });

    // 2. Reset timer on task
    task.timerStartedAt = null;
    const updatedTask = await task.save();

    res.json({
      task: updatedTask,
      log
    });
  } catch (error) {
    console.error('Error stopping timer:', error);
    res.status(500).json({ message: 'Server error stopping timer' });
  }
});

export default router;
