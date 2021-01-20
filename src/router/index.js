const express = require('express');
const router = express.Router();
const userRouter = require('./user');
const travelRouter = require('./travel');

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
    res.send('OK')
);

router.use('/user', userRouter);
router.use('/travel', travelRouter);

module.exports = router;