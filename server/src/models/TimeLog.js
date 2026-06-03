import mongoose from 'mongoose';

const TimeLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // in seconds
    required: true,
  },
}, {
  timestamps: true,
});

const TimeLog = mongoose.model('TimeLog', TimeLogSchema);
export default TimeLog;
