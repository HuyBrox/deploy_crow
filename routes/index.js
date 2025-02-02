import express from 'express';
import UserRouter from './user.route.js';
import ConnectRouter from './connect.route.js';
const router = express.Router();

router.use('', UserRouter);
router.use('', ConnectRouter);
export default router;