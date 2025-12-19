const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/attendance/check-in
 * @desc    Start work day (check in)
 * @access  Private
 */
router.post('/check-in', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        // Check if already checked in today
        let attendance = await Attendance.findOne({ user: userId, date: today });

        if (attendance && attendance.isCheckedIn) {
            return res.status(400).json({
                success: false,
                message: 'Already checked in today',
                data: { attendance },
            });
        }

        if (attendance && !attendance.isCheckedIn) {
            // Re-check-in after checkout (resume work)
            attendance.isCheckedIn = true;
            attendance.lastHeartbeat = now;
            await attendance.save();
        } else {
            // First check-in of the day
            attendance = new Attendance({
                user: userId,
                date: today,
                checkInTime: now,
                isCheckedIn: true,
                lastHeartbeat: now,
                hourlyLogs: [],
                totalActiveMinutes: 0,
            });
            await attendance.save();
        }

        res.status(201).json({
            success: true,
            message: 'Checked in successfully',
            data: { attendance },
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check in',
            error: error.message,
        });
    }
});

/**
 * @route   POST /api/attendance/heartbeat
 * @desc    Log hourly activity (called once per hour from app)
 * @access  Private
 */
router.post('/heartbeat', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const { activeMinutes = 60 } = req.body; // Default to full hour if not specified
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const currentHour = now.getHours();

        // Find the active session (handles overnight shifts)
        const attendance = await Attendance.findOne({ user: userId, isCheckedIn: true })
            .sort({ date: -1 });

        if (!attendance) {
            return res.status(400).json({
                success: false,
                message: 'No active session found to record heartbeat',
            });
        }

        // Check if this hour already logged
        const existingLog = attendance.hourlyLogs.find(log => log.hour === currentHour);

        if (existingLog) {
            // Update existing log (take higher value)
            existingLog.activeMinutes = Math.max(existingLog.activeMinutes, Math.min(activeMinutes, 60));
            existingLog.timestamp = now;
        } else {
            // Add new hourly log
            attendance.hourlyLogs.push({
                hour: currentHour,
                activeMinutes: Math.min(activeMinutes, 60),
                timestamp: now,
            });
        }

        // Recalculate total
        attendance.totalActiveMinutes = attendance.hourlyLogs.reduce(
            (sum, log) => sum + log.activeMinutes, 0
        );
        attendance.lastHeartbeat = now;

        await attendance.save();

        res.json({
            success: true,
            message: 'Heartbeat recorded',
            data: {
                hour: currentHour,
                totalActiveMinutes: attendance.totalActiveMinutes,
                totalActiveHours: Math.round(attendance.totalActiveMinutes / 60 * 10) / 10,
            },
        });
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record heartbeat',
            error: error.message,
        });
    }
});

/**
 * @route   POST /api/attendance/check-out
 * @desc    End work day (check out)
 * @access  Private
 */
router.post('/check-out', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        // Find the most recent active session for this user (handles overnight shifts)
        const attendance = await Attendance.findOne({ user: userId, isCheckedIn: true })
            .sort({ date: -1 });

        if (!attendance) {
            return res.status(400).json({
                success: false,
                message: 'No active session found. Please check in first.',
            });
        }

        if (!attendance.isCheckedIn) {
            return res.status(400).json({
                success: false,
                message: 'Already checked out',
                data: { attendance },
            });
        }

        attendance.checkOutTime = now;
        attendance.isCheckedIn = false;
        await attendance.save();

        res.json({
            success: true,
            message: 'Checked out successfully',
            data: {
                attendance,
                summary: {
                    checkIn: attendance.checkInTime,
                    checkOut: attendance.checkOutTime,
                    totalActiveHours: Math.round(attendance.totalActiveMinutes / 60 * 10) / 10,
                },
            },
        });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check out',
            error: error.message,
        });
    }
});

/**
 * @route   GET /api/attendance/status
 * @desc    Get current check-in status
 * @access  Private
 */
router.get('/status', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Look for active session first, then fallback to most recent record for today/anytime
        let attendance = await Attendance.findOne({ user: userId, isCheckedIn: true });

        if (!attendance) {
            attendance = await Attendance.findOne({ user: userId }).sort({ date: -1 });
        }

        res.json({
            success: true,
            data: {
                isCheckedIn: attendance?.isCheckedIn || false,
                checkInTime: attendance?.checkInTime || null,
                checkOutTime: attendance?.checkOutTime || null,
                totalActiveMinutes: attendance?.totalActiveMinutes || 0,
                totalActiveHours: attendance ? Math.round(attendance.totalActiveMinutes / 60 * 10) / 10 : 0,
                lastHeartbeat: attendance?.lastHeartbeat || null,
            },
        });
    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get status',
            error: error.message,
        });
    }
});

/**
 * @route   GET /api/attendance/stats
 * @desc    Get attendance statistics (daily/weekly/monthly)
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const { period = 'weekly' } = req.query;

        const stats = await Attendance.getStats(userId, period);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stats',
            error: error.message,
        });
    }
});

/**
 * @route   GET /api/attendance/employee/:employeeId
 * @desc    Get attendance for a specific employee (Admin use)
 * @access  Private (Owner/Admin)
 */
router.get('/employee/:employeeId', authenticate, async (req, res) => {
    try {
        // Check if requester is owner/admin
        if (req.user.role !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can view employee attendance',
            });
        }

        const { employeeId } = req.params;
        const { period = 'weekly' } = req.query;

        const stats = await Attendance.getStats(employeeId, period);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Employee stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get employee stats',
            error: error.message,
        });
    }
});

module.exports = router;
