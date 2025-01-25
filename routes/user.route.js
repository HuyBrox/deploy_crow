import express from 'express';
import {
    getLogin, postLogin, getRegister, postRegister, getLogout, getHome
} from '../controller/user.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();


router.get('/login', getLogin);
router.post('/login', postLogin);
router.get('/register', getRegister);
router.post('/register', postRegister);
router.get('/logout', getLogout);
router.get('/', auth, getHome);
export default router;