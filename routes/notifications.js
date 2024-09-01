import express from 'express';
import nodemailer from 'nodemailer';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Send notifications for upcoming tasks
router.post('/notifications', auth, async (req, res) => {
    try {
        const tasks = await Task.find({
            user: req.user.id,
            dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 24*60*60*1000) } // Tasks due within 24 hours
        });

        if (tasks.length === 0) {
            return res.status(200).json({ msg: 'No tasks requiring notification' });
        }

        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        tasks.forEach(task => {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: req.user.email,
                subject: 'Upcoming Task Reminder',
                text: `You have an upcoming task: ${task.title} due on ${task.dueDate}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.error('Error sending email: ', error);
                }
            });
        });

        res.status(200).json({ msg: 'Notifications sent' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

export default router;
