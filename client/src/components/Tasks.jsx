import { useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Play, Square, Sparkles, CheckCircle2, Circle, Clock, Check } from 'lucide-react';

const Tasks = ({ tasks, fetchTasks, runningTaskId, onStartTimer, onStopTimer }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [naturalInput, setNaturalInput] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleAIRequest = async () => {
    if (!naturalInput.trim()) return;
    setOptimizing(true);
    try {
      const data = await api.ai.optimize(naturalInput);
      setTitle(data.suggestion.title);
      setDescription(data.suggestion.description);
    } catch (error) {
      console.error('AI optimization failed:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.tasks.create(title, description);
      setTitle('');
      setDescription('');
      setNaturalInput('');
      setIsCreateOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    if (!title.trim() || !editingTask) return;
    setSaving(true);
    try {
      await api.tasks.update(editingTask._id, { title, description });
      setEditingTask(null);
      setIsEditOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      // If we mark completed and it was running, we notify parent to sync its state
      const wasRunning = task._id === runningTaskId;
      await api.tasks.update(task._id, { status: newStatus });
      fetchTasks();
      if (wasRunning && newStatus === 'Completed') {
        // Sync parent timer state (timer stopped on backend automatically)
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to change status:', error);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task? All logged time for this task will also be deleted.')) return;
    try {
      await api.tasks.delete(id);
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const openCreateModal = () => {
    setTitle('');
    setDescription('');
    setNaturalInput('');
    setIsCreateOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Task Directory</h2>
          <p className="text-zinc-400 text-sm">Create and organize your pending, active, and completed objectives.</p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-md shadow-violet-600/10 cursor-pointer gap-2 transition-all flex items-center justify-center self-start sm:self-auto py-5 px-4"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </Button>
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10"
            >
              <CheckCircle2 className="w-12 h-12 text-zinc-600 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-lg font-medium text-zinc-300">No tasks created yet</h3>
              <p className="text-zinc-500 text-sm mt-1 max-w-xs mx-auto">Create a task using natural language to begin managing your schedule.</p>
              <Button
                variant="outline"
                onClick={openCreateModal}
                className="mt-4 border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white cursor-pointer"
              >
                Create First Task
              </Button>
            </motion.div>
          ) : (
            tasks.map((task, idx) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                layout
              >
                <Card className={`border-zinc-800 bg-zinc-900/20 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/60 ${
                  task._id === runningTaskId ? 'ring-1 ring-violet-500/30 border-violet-500/20 shadow-lg shadow-violet-500/5' : ''
                }`}>
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Checkbox / Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <button
                        onClick={() => handleStatusChange(task, task.status === 'Completed' ? 'Pending' : 'Completed')}
                        className="mt-1 text-zinc-500 hover:text-violet-400 cursor-pointer transition-colors"
                      >
                        {task.status === 'Completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/10" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className={`text-lg font-semibold text-white tracking-tight ${task.status === 'Completed' ? 'line-through text-zinc-500' : ''}`}>
                            {task.title}
                          </h3>
                          <Badge className={
                            task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20' :
                            task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/10 border border-blue-500/20' :
                            'bg-amber-500/10 text-amber-400 hover:bg-amber-500/10 border border-amber-500/20'
                          }>
                            {task.status}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className={`text-zinc-400 text-sm font-light leading-relaxed max-w-2xl ${task.status === 'Completed' ? 'text-zinc-600' : ''}`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 self-end md:self-auto border-t md:border-t-0 border-zinc-800/60 pt-3 md:pt-0 w-full md:w-auto justify-end">
                      {/* Timer controls */}
                      {task.status !== 'Completed' && (
                        task._id === runningTaskId ? (
                          <Button
                            variant="destructive"
                            onClick={() => onStopTimer(task._id)}
                            className="bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/20 cursor-pointer flex items-center gap-2 h-9 px-3 text-xs"
                          >
                            <Square className="w-3.5 h-3.5 fill-red-400" />
                            Stop
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => onStartTimer(task._id)}
                            className="border-violet-500/25 hover:border-violet-500/50 bg-violet-600/5 text-violet-400 hover:bg-violet-600/10 cursor-pointer flex items-center gap-2 h-9 px-3 text-xs"
                          >
                            <Play className="w-3.5 h-3.5 fill-violet-400" />
                            Start Timer
                          </Button>
                        )
                      )}

                      {/* Dropdown status switcher */}
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs rounded-lg p-1.5 focus:ring-1 focus:ring-violet-500 outline-none cursor-pointer h-9"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>

                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(task)}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800/80 cursor-pointer w-9 h-9"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTask(task._id)}
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/5 cursor-pointer w-9 h-9"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* CREATE TASK DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Create New Task</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Input what you want to work on in plain natural language, and let the AI structure it for you.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Natural Language Input</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="follow up with UI designer about dashboard wireframe delivery status"
                  value={naturalInput}
                  onChange={(e) => setNaturalInput(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 focus:border-violet-500 focus:ring-violet-500 placeholder-zinc-600 text-white"
                />
                <Button
                  type="button"
                  onClick={handleAIRequest}
                  disabled={optimizing || !naturalInput.trim()}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-medium cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                >
                  {optimizing ? (
                    'Analyzing...'
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-violet-200 fill-violet-200/20" />
                      AI Optimize
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 my-4 pt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Task Title</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Follow up with UI Designer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 focus:border-violet-500 focus:ring-violet-500 placeholder-zinc-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Description (Optional)</label>
                <textarea
                  placeholder="e.g. Send a Slack message to confirm wireframe delivery status."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-24 bg-zinc-950 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg p-3 outline-none text-white text-sm placeholder-zinc-600"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-zinc-800/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !title.trim()}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white cursor-pointer"
              >
                {saving ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT TASK DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Edit Task</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Modify the details of your objective.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditTask} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Task Title</label>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus:border-violet-500 focus:ring-violet-500 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-24 bg-zinc-950 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg p-3 outline-none text-white text-sm"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-zinc-800/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !title.trim()}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
