// routes/router.js
import express from 'express';
import adminRoutes from './admin.routes.js';
import authRoutes from './auth.js';
import parkingRoutes from './parking.routes.js';
 
const router = express.Router();
 
// Routes principales versionnées
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/parking', parkingRoutes);
 
export default router;
