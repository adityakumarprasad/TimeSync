import { useState } from 'react';
import api from '../services/api';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, Play, Square, Sparkles, Clock, Check, ChevronDown, CheckSquare } from 'lucide-react';

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
      const wasRunning = task._id === runningTaskId;
      await api.tasks.update(task._id, { status: newStatus });
      fetchTasks();
      if (wasRunning && newStatus === 'Completed') {
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
    <div className="flex flex-col gap-8">
      {/* Header section */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-slate-900 text-3xl leading-9 tracking-tight">
            Task Directory
          </h1>
          <p className="text-slate-500 text-sm leading-5">
            Create and organize your pending, active, and completed objectives.
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-[linear-gradient(135deg,#10B981,#059669)] shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-opacity hover:opacity-95 font-semibold rounded-lg text-white text-sm leading-5 flex px-4 py-2.5 items-center gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Task List container */}
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50/50"
            >
              <CheckSquare className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-lg font-medium text-slate-700">No tasks created yet</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Create a task using natural language to begin managing your schedule.</p>
              <button
                onClick={openCreateModal}
                className="mt-4 border-slate-200 hover:bg-slate-100 border border-solid rounded-lg text-slate-600 hover:text-slate-900 px-4 py-2 cursor-pointer transition-colors"
              >
                Create First Task
              </button>
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
                <div className={`shadow-[0_4px_16px_rgba(0,0,0,0.04)] rounded-xl bg-white border border-slate-200 p-6 transition-all duration-300 hover:border-slate-300 ${
                  task._id === runningTaskId ? 'ring-1 ring-emerald-500/30 border-emerald-500/20 shadow-md shadow-emerald-500/5' : ''
                }`}>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left side info */}
                    <div className="flex items-start gap-4 flex-1">
                      <button 
                        onClick={() => handleStatusChange(task, task.status === 'Completed' ? 'Pending' : 'Completed')}
                        className={`size-6 shrink-0 transition-colors rounded-full flex mt-0.5 justify-center items-center cursor-pointer ${
                          task.status === 'Completed' 
                            ? 'bg-emerald-500 text-white' 
                            : 'border-slate-300 border-2 border-solid hover:border-emerald-500'
                        }`}
                      >
                        {task.status === 'Completed' && <Check className="size-4" />}
                      </button>
                      <div className="min-w-0 flex flex-col flex-1 gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className={`font-bold text-lg leading-7 ${
                            task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}>
                            {task.title}
                          </h2>
                          {task.status === 'Completed' && (
                            <span className="font-semibold rounded-full bg-emerald-50 text-emerald-700 text-xs leading-4 flex px-2.5 py-0.5 items-center gap-1.5 border border-emerald-200">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Completed
                            </span>
                          )}
                          {task.status === 'In Progress' && (
                            <span className="font-semibold rounded-full bg-sky-50 text-sky-700 text-xs leading-4 flex px-2.5 py-0.5 items-center gap-1.5 border border-sky-200">
                              <span className="size-1.5 rounded-full bg-sky-500" />
                              In Progress
                            </span>
                          )}
                          {task.status === 'Pending' && (
                            <span className="font-semibold rounded-full bg-amber-50 text-amber-700 text-xs leading-4 flex px-2.5 py-0.5 items-center gap-1.5 border border-amber-200">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Pending
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className={`max-w-2xl leading-relaxed text-sm leading-5 ${
                            task.status === 'Completed' ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right side controls */}
                    <div className="shrink-0 flex items-center gap-2 self-end md:self-auto border-t md:border-t-0 border-slate-200 pt-3 md:pt-0 w-full md:w-auto justify-end">
                      {task.status !== 'Completed' && (
                        task._id === runningTaskId ? (
                          <button 
                            onClick={() => onStopTimer(task._id)}
                            className="shadow-[0_4px_14px_rgba(239,68,68,0.2)] transition-all font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm leading-5 flex px-3 py-2 items-center gap-2 cursor-pointer"
                          >
                            <Square className="size-3.5 fill-white" />
                            <span>Stop Timer</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => onStartTimer(task._id)}
                            className="shadow-[0_4px_14px_rgba(16,185,129,0.2)] transition-all font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm leading-5 flex px-3 py-2 items-center gap-2 cursor-pointer"
                          >
                            <Play className="size-3.5 fill-white" />
                            <span>Start Timer</span>
                          </button>
                        )
                      )}

                      {/* Dropdown status switcher */}
                      <div className="relative flex items-center">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value)}
                          className="appearance-none transition-colors rounded-lg bg-white text-slate-700 text-sm leading-5 border-slate-200 border border-solid pl-3 pr-8 py-2 cursor-pointer outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <ChevronDown className="size-4 text-slate-400 absolute right-2.5 pointer-events-none" />
                      </div>

                      {/* Edit Pencil Button */}
                      <button 
                        onClick={() => openEditModal(task)}
                        className="size-9 transition-colors rounded-lg bg-white text-slate-500 border border-slate-200 border-solid flex justify-center items-center cursor-pointer hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Pencil className="size-4" />
                      </button>

                      {/* Delete Trash Button */}
                      <button 
                        onClick={() => handleDeleteTask(task._id)}
                        className="size-9 transition-colors rounded-lg bg-white text-red-500 border border-slate-200 border-solid flex justify-center items-center cursor-pointer hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* CREATE TASK DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-slate-200 bg-white text-slate-900 max-w-lg rounded-2xl shadow-xl shadow-slate-200/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Create New Task</DialogTitle>
            <DialogDescription className="text-slate-500">
              Input what you want to work on in plain natural language, and let the AI structure it for you.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Natural Language Input</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="follow up with UI designer about dashboard wireframe delivery status"
                  value={naturalInput}
                  onChange={(e) => setNaturalInput(e.target.value)}
                  className="bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 placeholder-slate-400 text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAIRequest}
                  disabled={optimizing || !naturalInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer flex items-center gap-1.5 flex-shrink-0 px-4 py-2 rounded-lg transition-colors"
                >
                  {optimizing ? (
                    'Analyzing...'
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-100 fill-emerald-100/20" />
                      AI Optimize
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 my-4 pt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Task Title</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Follow up with UI Designer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 placeholder-slate-400 text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description (Optional)</label>
                <textarea
                  placeholder="e.g. Send a Slack message to confirm wireframe delivery status."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-24 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 outline-none text-slate-900 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-500 hover:text-slate-800 cursor-pointer hover:bg-slate-100 rounded-lg px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer rounded-lg px-4 py-2 transition-colors"
              >
                {saving ? 'Creating...' : 'Create Task'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT TASK DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-slate-200 bg-white text-slate-900 max-w-lg rounded-2xl shadow-xl shadow-slate-200/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Task</DialogTitle>
            <DialogDescription className="text-slate-500">
              Modify the details of your objective.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditTask} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Task Title</label>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-24 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 outline-none text-slate-900 text-sm"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-slate-500 hover:text-slate-800 cursor-pointer hover:bg-slate-100 rounded-lg px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer rounded-lg px-4 py-2 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
