import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/reports/sales - Get comprehensive sales analytics (Admin only)
router.get('/sales', authenticate, requireRoles(['ADMIN']), async (_req: AuthRequest, res: Response) => {
  try {
    const totalOrders = await prisma.order.count();
    const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });
    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
    const inProgressOrders = await prisma.order.count({ where: { status: 'IN_PROGRESS' } });

    // Calculate total revenue from non-cancelled orders
    const revenueAgg = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { not: 'CANCELLED' } },
    });
    const totalRevenue = revenueAgg._sum.totalAmount || 0;

    // Fetch popular menu items
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: { status: { not: 'CANCELLED' } },
      },
      include: {
        menuItem: true,
      },
    });

    const itemSalesMap: { [id: string]: { name: string; category: string; count: number; revenue: number } } = {};
    const categoryRevenueMap: { [category: string]: number } = {};

    for (const item of orderItems) {
      if (!itemSalesMap[item.menuItemId]) {
        itemSalesMap[item.menuItemId] = {
          name: item.menuItem.name,
          category: item.menuItem.category,
          count: 0,
          revenue: 0,
        };
      }
      itemSalesMap[item.menuItemId].count += item.quantity;
      itemSalesMap[item.menuItemId].revenue += item.quantity * item.unitPrice;

      categoryRevenueMap[item.menuItem.category] = (categoryRevenueMap[item.menuItem.category] || 0) + item.quantity * item.unitPrice;
    }

    const popularItems = Object.values(itemSalesMap).sort((a, b) => b.count - a.count);

    return res.json({
      summary: {
        totalRevenue,
        totalOrders,
        completedOrders,
        pendingOrders,
        inProgressOrders,
      },
      popularItems,
      categoryRevenue: categoryRevenueMap,
    });
  } catch (error) {
    console.error('Fetch sales report error:', error);
    return res.status(500).json({ error: 'Failed to generate sales report' });
  }
});

// GET /api/reports/trends - Ingredient usage trends (Admin only)
router.get('/trends', authenticate, requireRoles(['ADMIN']), async (_req: AuthRequest, res: Response) => {
  try {
    const transactions = await prisma.stockTransaction.findMany({
      include: {
        ingredient: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const usageByIngredient: { [ingredientName: string]: { totalUsed: number; wasteCount: number; unit: string } } = {};

    for (const tx of transactions) {
      const name = tx.ingredient.name;
      if (!usageByIngredient[name]) {
        usageByIngredient[name] = { totalUsed: 0, wasteCount: 0, unit: tx.ingredient.unit };
      }

      if (tx.type === 'ORDER_DEDUCTION') {
        usageByIngredient[name].totalUsed += Math.abs(tx.quantityChange);
      } else if (tx.type === 'WASTE') {
        usageByIngredient[name].wasteCount += Math.abs(tx.quantityChange);
      }
    }

    const ingredientTrends = Object.entries(usageByIngredient).map(([ingredient, data]) => ({
      ingredient,
      totalUsed: data.totalUsed,
      wasteCount: data.wasteCount,
      unit: data.unit,
    }));

    return res.json({ trends: ingredientTrends });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate usage trends' });
  }
});

export default router;
