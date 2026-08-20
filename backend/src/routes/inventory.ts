import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';
import { AuthRequest } from '../types';
import { emitLowStockAlert, emitDataUpdated } from '../socket';

const router = Router();

// GET /api/inventory - Get all ingredients and their current stock levels
router.get('/', authenticate, requireRoles(['STAFF', 'ADMIN']), async (_req: AuthRequest, res: Response) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });

    const formattedIngredients = ingredients.map((ing) => ({
      ...ing,
      isLowStock: ing.currentStock <= ing.reorderThreshold,
    }));

    return res.json({ ingredients: formattedIngredients });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/inventory - Add new ingredient (Admin/Staff)
router.post('/', authenticate, requireRoles(['ADMIN', 'STAFF']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, currentStock, unit, reorderThreshold, costPerUnit } = req.body;

    if (!name || currentStock === undefined || !unit) {
      return res.status(400).json({ error: 'Name, currentStock, and unit are required' });
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        currentStock: parseFloat(currentStock),
        unit,
        reorderThreshold: parseFloat(reorderThreshold || '10'),
        costPerUnit: parseFloat(costPerUnit || '0'),
      },
    });

    emitDataUpdated();
    return res.status(201).json({ message: 'Ingredient added successfully', ingredient });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'An ingredient with this name already exists' });
    }
    return res.status(500).json({ error: 'Failed to add ingredient' });
  }
});

// PUT /api/inventory/:id - Update ingredient settings (Admin/Staff)
router.put('/:id', authenticate, requireRoles(['ADMIN', 'STAFF']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, unit, reorderThreshold, costPerUnit } = req.body;

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        unit,
        reorderThreshold: reorderThreshold !== undefined ? parseFloat(reorderThreshold) : undefined,
        costPerUnit: costPerUnit !== undefined ? parseFloat(costPerUnit) : undefined,
      },
    });

    emitDataUpdated();
    return res.json({ message: 'Ingredient updated successfully', ingredient: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

// POST /api/inventory/restock - Log stock transaction (RESTOCK / ADJUSTMENT / WASTE) & update stock
router.post('/restock', authenticate, requireRoles(['STAFF', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { ingredientId, quantityChange, type, reason } = req.body;

    if (!ingredientId || quantityChange === undefined || !type) {
      return res.status(400).json({ error: 'Ingredient ID, quantityChange, and transaction type are required' });
    }

    const changeVal = parseFloat(quantityChange);
    const validTypes = ['RESTOCK', 'ADJUSTMENT', 'WASTE'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type. Allowed: RESTOCK, ADJUSTMENT, WASTE' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({ where: { id: ingredientId } });
      if (!ingredient) {
        throw new Error('Ingredient not found');
      }

      const newStock = Math.max(0, ingredient.currentStock + changeVal);

      const updatedIngredient = await tx.ingredient.update({
        where: { id: ingredientId },
        data: { currentStock: newStock },
      });

      const transaction = await tx.stockTransaction.create({
        data: {
          ingredientId,
          quantityChange: changeVal,
          type,
          reason: reason || (type === 'RESTOCK' ? 'Manual Restock' : 'Stock Adjustment'),
          performedByUserId: req.user?.userId,
        },
      });

      if (newStock <= updatedIngredient.reorderThreshold) {
        emitLowStockAlert({
          id: updatedIngredient.id,
          name: updatedIngredient.name,
          currentStock: newStock,
          threshold: updatedIngredient.reorderThreshold,
        });
      }

      return { updatedIngredient, transaction };
    });

    emitDataUpdated();
    return res.json({
      message: 'Stock updated and transaction recorded successfully',
      ingredient: result.updatedIngredient,
      transaction: result.transaction,
    });
  } catch (error: any) {
    console.error('Restock error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process restock' });
  }
});

// GET /api/inventory/transactions - Get stock transactions history (Staff/Admin)
router.get('/transactions', authenticate, requireRoles(['STAFF', 'ADMIN']), async (_req: AuthRequest, res: Response) => {
  try {
    const transactions = await prisma.stockTransaction.findMany({
      include: {
        ingredient: true,
        performedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch stock transactions' });
  }
});

// DELETE /api/inventory/:id - Delete ingredient (Admin only)
router.delete('/:id', authenticate, requireRoles(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.ingredient.delete({ where: { id } });
    emitDataUpdated();
    return res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete ingredient' });
  }
});

export default router;
