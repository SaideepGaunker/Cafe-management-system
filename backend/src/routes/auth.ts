import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { authenticate, requireRoles, getJwtSecret } from '../middleware/auth';
import { AuthRequest, JwtPayload } from '../types';

const router = Router();

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 250): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt >= retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Database operation failed');
}

// Register User (Default CUSTOMER, or specified role if Admin creates)
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await withRetry(() => prisma.user.findUnique({ where: { email } }));
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Security Privilege Escalation Guard: Only authenticated ADMIN can assign STAFF or ADMIN role
    let assignedRole = 'CUSTOMER';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], getJwtSecret()) as JwtPayload;
        if (decoded.role === 'ADMIN' && role && ['STAFF', 'ADMIN'].includes(role)) {
          assignedRole = role;
        }
      } catch {}
    }

    const user = await withRetry(() => prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword,
        phone: phone ? phone.trim() : null,
        role: assignedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        addresses: true,
      },
    }));

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login User
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await withRetry(() => prisma.user.findUnique({
      where: { email },
      include: {
        addresses: { orderBy: { createdAt: 'desc' } },
      },
    }));
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        addresses: user.addresses,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get Current User Profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        addresses: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update Profile Info (Name & Phone Number)
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user!.userId;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        addresses: { orderBy: { createdAt: 'desc' } },
      },
    });

    return res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Add New Delivery Address
router.post('/addresses', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { label, street, aptSuite, city, zipCode, isDefault } = req.body;

    if (!street || !city || !zipCode) {
      return res.status(400).json({ error: 'Street, city, and zip code are required' });
    }

    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.customerAddress.create({
      data: {
        userId,
        label: label || 'Home',
        street: street.trim(),
        aptSuite: aptSuite ? aptSuite.trim() : null,
        city: city.trim(),
        zipCode: zipCode.trim(),
        isDefault: !!isDefault,
      },
    });

    return res.status(201).json({ message: 'Address added successfully', address });
  } catch (error) {
    console.error('Add address error:', error);
    return res.status(500).json({ error: 'Failed to add delivery address' });
  }
});

// Update Existing Delivery Address
router.put('/addresses/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { label, street, aptSuite, city, zipCode, isDefault } = req.body;

    const existing = await prisma.customerAddress.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Address not found' });
    }

    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.customerAddress.update({
      where: { id },
      data: {
        label: label || existing.label,
        street: street ? street.trim() : existing.street,
        aptSuite: aptSuite !== undefined ? (aptSuite ? aptSuite.trim() : null) : existing.aptSuite,
        city: city ? city.trim() : existing.city,
        zipCode: zipCode ? zipCode.trim() : existing.zipCode,
        isDefault: isDefault !== undefined ? !!isDefault : existing.isDefault,
      },
    });

    return res.json({ message: 'Address updated successfully', address: updatedAddress });
  } catch (error) {
    console.error('Update address error:', error);
    return res.status(500).json({ error: 'Failed to update address' });
  }
});

// Delete Delivery Address
router.delete('/addresses/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.customerAddress.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.customerAddress.delete({ where: { id } });

    return res.json({ message: 'Address removed successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    return res.status(500).json({ error: 'Failed to delete address' });
  }
});

// List all users (Admin only)
router.get('/users', authenticate, requireRoles(['ADMIN']), async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (Admin only)
router.patch('/users/:id/role', authenticate, requireRoles(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['CUSTOMER', 'STAFF', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
