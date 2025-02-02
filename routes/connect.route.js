import express from 'express';
import {
    call
} from '../controller/connect.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();


router.get('/call/:receiverId/type/:type', auth, call);

export default router;