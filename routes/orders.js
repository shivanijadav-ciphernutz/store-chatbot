import express from 'express';  
const router = express.Router();
import { authenticateToken } from '../auth.js';
import dbOps from '../db.js';

router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
        const sortField = req.query.sortField || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
        const skip = (page - 1) * limit;
    
        const { items, total } = await dbOps.findDocumentsPaginated('orders', {
          query: {},
          projection: { password: 0 },
          sort: { [sortField]: sortOrder },
          skip,
          limit
        });
    
        res.json({
          success: true,
          data: items,
          page,
          pageSize: limit,
          total,
          hasMore: skip + items.length < total
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error fetching orders',
          error: error.message
        });
      }
});

export default router;