import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';
import { AuthRequest, JwtPayload } from '../types';
import { emitOrderCreated, emitOrderStatusUpdated, emitLowStockAlert } from '../socket';
import { sendOrderStatusEmail } from '../services/mailService';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cafe_artisan_secret_key_2026_super_secure';

// POST /api/orders - Place an order (Customer / Guest / Staff)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { customerName, customerEmail, phone, deliveryAddress, deliveryNotes, deliveryFee, tableNumber, orderType, items } = req.body;

    // Check optional token header
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as JwtPayload;
        userId = decoded.userId;
      } catch {}
    }

    if (!customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer name and at least one item are required' });
    }

    // Consolidate cart items by menuItemId to eliminate duplicates and aggregate total quantities
    const itemQuantityMap = new Map<string, number>();
    for (const item of items) {
      if (!item || !item.menuItemId) continue;
      const rawQty = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity, 10);
      const qty = Math.max(1, isNaN(rawQty) ? 1 : rawQty);
      itemQuantityMap.set(item.menuItemId, (itemQuantityMap.get(item.menuItemId) || 0) + qty);
    }

    if (itemQuantityMap.size === 0) {
      return res.status(400).json({ error: 'At least one valid menu item is required' });
    }

    // Fetch full menu items for requested order items
    const menuItemIds = Array.from(itemQuantityMap.keys());
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: {
        recipe: {
          include: { ingredient: true },
        },
      },
    });

    const menuItemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    // Aggregate required ingredient quantities for this order
    const requiredIngredients: { [ingredientId: string]: { name: string; unit?: string; required: number; currentStock: number; threshold: number } } = {};
    let totalAmount = 0;
    const orderItemsToCreate: { menuItemId: string; quantity: number; unitPrice: number }[] = [];

    for (const [menuItemId, quantity] of itemQuantityMap.entries()) {
      const dbItem = menuItemMap.get(menuItemId);
      if (!dbItem) {
        return res.status(404).json({ error: `Menu item not found` });
      }
      if (!dbItem.isAvailable) {
        return res.status(400).json({ error: `Menu item "${dbItem.name}" is currently unavailable` });
      }

      totalAmount += dbItem.price * quantity;

      orderItemsToCreate.push({
        menuItemId: dbItem.id,
        quantity,
        unitPrice: dbItem.price,
      });

      // Calculate ingredient requirements
      for (const recipeItem of dbItem.recipe || []) {
        const ing = recipeItem.ingredient;
        if (!ing) continue;

        const totalNeeded = recipeItem.quantityRequired * quantity;

        if (!requiredIngredients[ing.id]) {
          requiredIngredients[ing.id] = {
            name: ing.name,
            unit: ing.unit,
            required: 0,
            currentStock: ing.currentStock,
            threshold: ing.reorderThreshold,
          };
        }
        requiredIngredients[ing.id].required += totalNeeded;
      }
    }

    // Add optional delivery fee
    const fee = parseFloat(deliveryFee) || 0;
    if (orderType === 'DELIVERY' && fee > 0) {
      totalAmount += fee;
    }

    // Check stock availability
    for (const ingId in requiredIngredients) {
      const ing = requiredIngredients[ingId];
      if (ing.currentStock < ing.required) {
        return res.status(400).json({
          error: `Insufficient stock for "${ing.name}". Needed: ${ing.required}${ing.unit ? ' ' + ing.unit : ''}, Available: ${ing.currentStock}${ing.unit ? ' ' + ing.unit : ''}`,
        });
      }
    }

    // Determine email for notifications (from request or logged-in user)
    let emailToStore = customerEmail ? String(customerEmail).trim() : null;
    if (!emailToStore && userId) {
      const userObj = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (userObj) emailToStore = userObj.email;
    }

    // Safely check if userId is a valid 24-char ObjectId string for MongoDB relations
    const validPerformedByUserId = userId && userId.length === 24 ? userId : undefined;

    // Perform database transaction: Create Order + OrderItems, Deduct Stock & Create StockTransactions
    const order = await prisma.$transaction(
      async (tx) => {
        const createdOrder = await tx.order.create({
          data: {
            userId: validPerformedByUserId,
            customerName,
            customerEmail: emailToStore,
            phone: phone || null,
            deliveryAddress: deliveryAddress || null,
            deliveryNotes: deliveryNotes || null,
            deliveryFee: fee,
            tableNumber: tableNumber || (orderType === 'DELIVERY' ? 'Home Delivery' : 'Counter'),
            orderType: orderType || 'DELIVERY',
            status: 'PENDING',
            totalAmount,
            items: {
              create: orderItemsToCreate,
            },
          },
          include: {
            items: {
              include: { menuItem: true },
            },
            user: {
              select: { name: true, email: true },
            },
          },
        });

        // Deduct ingredient stock concurrently and log stock transactions
        const lowStockAlerts: { id: string; name: string; currentStock: number; threshold: number }[] = [];
        const ingIds = Object.keys(requiredIngredients);

        // Update all ingredient stock levels in parallel within transaction
        const updatedIngredients = await Promise.all(
          ingIds.map((ingId) => {
            const ing = requiredIngredients[ingId];
            return tx.ingredient.update({
              where: { id: ingId },
              data: { currentStock: { decrement: ing.required } },
            });
          })
        );

        // Record stock transactions in parallel within transaction
        await Promise.all(
          ingIds.map((ingId) => {
            const ing = requiredIngredients[ingId];
            return tx.stockTransaction
              .create({
                data: {
                  ingredientId: ingId,
                  quantityChange: -ing.required,
                  type: 'ORDER_DEDUCTION',
                  reason: `Order #${createdOrder.id.slice(0, 8)}`,
                  performedByUserId: validPerformedByUserId,
                },
              })
              .catch((stErr) => {
                console.warn('Stock transaction warning:', stErr);
              });
          })
        );

        for (const updatedIng of updatedIngredients) {
          const ing = requiredIngredients[updatedIng.id];
          if (updatedIng.currentStock <= ing.threshold) {
            lowStockAlerts.push({
              id: updatedIng.id,
              name: ing.name,
              currentStock: updatedIng.currentStock,
              threshold: ing.threshold,
            });
          }
        }

        return { createdOrder, lowStockAlerts };
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    // Real-time broadcast
    emitOrderCreated(order.createdOrder);

    // Send Mail notification for order confirmation
    const recipientEmail = order.createdOrder.customerEmail || order.createdOrder.user?.email;
    if (recipientEmail) {
      sendOrderStatusEmail(order.createdOrder, recipientEmail, 'CONFIRMATION').catch((err) => {
        console.error(`Failed sending confirmation email for Order ${order.createdOrder.id}:`, err);
      });
    }

    if (order.lowStockAlerts.length > 0) {
      for (const alert of order.lowStockAlerts) {
        emitLowStockAlert(alert);
      }
    }

    return res.status(201).json({
      message: 'Order placed successfully',
      order: order.createdOrder,
    });
  } catch (error: any) {
    if (error?.code === 'P2023' || error?.code === 'P2010') {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    console.error('Create order error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to place order' });
  }
});

// GET /api/orders - Fetch orders (Filtered by Auth Role: STAFF/ADMIN see all, CUSTOMER sees own, Unauthenticated sees empty)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    let whereClause: any = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as JwtPayload;
        if (decoded.role === 'STAFF' || decoded.role === 'ADMIN') {
          whereClause = {}; // Full access for Kitchen KDS & Admin Portal
        } else if (decoded.role === 'CUSTOMER') {
          const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
          whereClause = {
            OR: [
              { userId: decoded.userId },
              ...(user?.email ? [{ customerEmail: user.email }] : []),
            ],
          };
        }
      } catch {}
    }

    if (whereClause === null) {
      // Unauthenticated caller: return empty array for privacy & security
      return res.json({ orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/public/:id - Fetch order details by ID for real-time customer tracking
router.get('/public/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// PATCH /api/orders/:id/status - Update order status (Staff/Admin)
router.patch('/:id/status', authenticate, requireRoles(['STAFF', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const orderBefore = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                recipe: true,
              },
            },
          },
        },
      },
    });

    if (!orderBefore) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If order is changed to CANCELLED and was not already cancelled, restock ingredients
    if (status === 'CANCELLED' && orderBefore.status !== 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        for (const item of orderBefore.items) {
          for (const r of item.menuItem.recipe) {
            const qtyToReturn = r.quantityRequired * item.quantity;
            await tx.ingredient.update({
              where: { id: r.ingredientId },
              data: { currentStock: { increment: qtyToReturn } },
            });

            await tx.stockTransaction.create({
              data: {
                ingredientId: r.ingredientId,
                quantityChange: qtyToReturn,
                type: 'ADJUSTMENT',
                reason: `Restocked from Cancelled Order #${id.slice(0, 8)}`,
                performedByUserId: req.user?.userId,
              },
            });
          }
        }
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        items: {
          include: { menuItem: true },
        },
      },
    });

    // Emit socket event
    emitOrderStatusUpdated(updatedOrder);

    // Send Mail notification for status changes
    const recipientEmail = updatedOrder.customerEmail || updatedOrder.user?.email;
    if (recipientEmail) {
      sendOrderStatusEmail(updatedOrder, recipientEmail, status).catch((err) => {
        console.error(`Failed sending status email for Order ${updatedOrder.id}:`, err);
      });
    } else {
      console.warn(`⚠️ Order #${updatedOrder.id.slice(0, 8)} status set to ${status}, but no customer email address was recorded.`);
    }

    return res.json({ message: 'Order status updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
