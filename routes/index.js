import express from 'express';
import UserRouter from './user.route.js';
const router = express.Router();

router.use('', UserRouter);
export default router;