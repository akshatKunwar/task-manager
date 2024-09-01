import express from 'express';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';

const router = express.Router();

export default (io) => {
// Create a new task
router.post('/tasks', auth, async (req, res) => {
    try {
        const newTask = new Task({
            user: req.user.id,
            title: req.body.title,
            description: req.body.description,
            dueDate: req.body.dueDate,
            priority: req.body.priority,
        });

        const task = await newTask.save();

        // Emit a real-time event to notify about the new task
        io.emit('newTask', task);

        res.json(task);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});


// Get all tasks for the logged-in user
router.get('/tasks', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get a single task by ID
router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Update a task
router.put('/tasks/:id', auth, async (req, res) => {
    const { title, description, dueDate, priority, completed } = req.body;

    try {
        let task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        task = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: { title, description, dueDate, priority, completed } },
            { new: true }
        );
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Delete a task
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await task.remove();
        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// GET /api/tasks/upcoming - Get upcoming tasks
router.get('/upcoming', authMiddleware, async (req, res) => {
    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
  
      // Find tasks with dueDate between today and nextWeek
      const upcomingTasks = await Task.find({
        dueDate: {
          $gte: today,
          $lte: nextWeek
        },
        userId: req.user._id // assuming tasks are user-specific
      });
  
      res.json(upcomingTasks);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching upcoming tasks', error });
    }
  });

return router;
};

