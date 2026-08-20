import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/suppliers - Get supplier catalog (Admin only)
router.get('/', authenticate, requireRoles(['ADMIN']), async (_req: AuthRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json({ suppliers });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// POST /api/suppliers - Create supplier (Admin only)
router.post('/', authenticate, requireRoles(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, contactPerson, email, phone, category, address } = req.body;

    if (!name || !contactPerson || !email) {
      return res.status(400).json({ error: 'Name, contactPerson, and email are required' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        email,
        phone: phone || '',
        category: category || 'General Supplies',
        address: address || '',
      },
    });

    return res.status(201).json({ message: 'Supplier created successfully', supplier });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// PUT /api/suppliers/:id - Update supplier (Admin only)
router.put('/:id', authenticate, requireRoles(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, email, phone, category, address } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contactPerson,
        email,
        phone,
        category,
        address,
      },
    });

    return res.json({ message: 'Supplier updated successfully', supplier });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// DELETE /api/suppliers/:id - Delete supplier (Admin only)
router.delete('/:id', authenticate, requireRoles(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.supplier.delete({ where: { id } });
    return res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;
