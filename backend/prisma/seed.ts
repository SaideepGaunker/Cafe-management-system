import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records
  await prisma.stockTransaction.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.menuItemIngredient.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.ingredient.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Default Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Elena Vance (Manager)',
      email: 'admin@cafe.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Marcus Barista',
      email: 'staff@cafe.com',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: 'Sophia Reed',
      email: 'customer@cafe.com',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });

  console.log('✅ Created users: Admin (admin@cafe.com), Staff (staff@cafe.com), Customer (customer@cafe.com)');

  // 3. Create Ingredients
  const espressoBeans = await prisma.ingredient.create({
    data: { name: 'Espresso Coffee Beans', currentStock: 5000, unit: 'grams', reorderThreshold: 1000, costPerUnit: 0.02 },
  });

  const wholeMilk = await prisma.ingredient.create({
    data: { name: 'Whole Milk', currentStock: 15000, unit: 'ml', reorderThreshold: 3000, costPerUnit: 0.003 },
  });

  const oatMilk = await prisma.ingredient.create({
    data: { name: 'Oat Milk', currentStock: 8000, unit: 'ml', reorderThreshold: 2000, costPerUnit: 0.005 },
  });

  const chocolateSyrup = await prisma.ingredient.create({
    data: { name: 'Artisan Dark Chocolate Syrup', currentStock: 2500, unit: 'ml', reorderThreshold: 500, costPerUnit: 0.01 },
  });

  const vanillaSyrup = await prisma.ingredient.create({
    data: { name: 'Vanilla Syrup', currentStock: 3000, unit: 'ml', reorderThreshold: 600, costPerUnit: 0.008 },
  });

  const matchaPowder = await prisma.ingredient.create({
    data: { name: 'Ceremonial Matcha Powder', currentStock: 800, unit: 'grams', reorderThreshold: 300, costPerUnit: 0.08 },
  });

  const butter = await prisma.ingredient.create({
    data: { name: 'French Butter', currentStock: 1200, unit: 'grams', reorderThreshold: 400, costPerUnit: 0.03 },
  });

  const cups = await prisma.ingredient.create({
    data: { name: 'Eco Bio Cup 12oz', currentStock: 150, unit: 'units', reorderThreshold: 50, costPerUnit: 0.15 },
  });

  const avocado = await prisma.ingredient.create({
    data: { name: 'Fresh Hass Avocado', currentStock: 100, unit: 'units', reorderThreshold: 20, costPerUnit: 0.80 },
  });

  const sourdough = await prisma.ingredient.create({
    data: { name: 'Artisan Sourdough Bread', currentStock: 50, unit: 'units', reorderThreshold: 10, costPerUnit: 0.50 },
  });

  const caramelSyrup = await prisma.ingredient.create({
    data: { name: 'Salted Caramel Drizzle', currentStock: 2000, unit: 'ml', reorderThreshold: 400, costPerUnit: 0.01 },
  });

  const chaiConcentrate = await prisma.ingredient.create({
    data: { name: 'Masala Chai Tea Concentrate', currentStock: 5000, unit: 'ml', reorderThreshold: 1000, costPerUnit: 0.006 },
  });

  const condensedMilk = await prisma.ingredient.create({
    data: { name: 'Sweetened Condensed Milk', currentStock: 4000, unit: 'ml', reorderThreshold: 1000, costPerUnit: 0.007 },
  });

  const blueberries = await prisma.ingredient.create({
    data: { name: 'Organic Wild Blueberries', currentStock: 2000, unit: 'grams', reorderThreshold: 500, costPerUnit: 0.02 },
  });

  const almondFlakes = await prisma.ingredient.create({
    data: { name: 'Toasted Almond Flakes', currentStock: 1500, unit: 'grams', reorderThreshold: 300, costPerUnit: 0.025 },
  });

  const bagels = await prisma.ingredient.create({
    data: { name: 'Everything Artisan Bagels', currentStock: 80, unit: 'units', reorderThreshold: 20, costPerUnit: 0.60 },
  });

  const creamCheese = await prisma.ingredient.create({
    data: { name: 'Whipped Cream Cheese', currentStock: 2500, unit: 'grams', reorderThreshold: 500, costPerUnit: 0.015 },
  });

  const smokedSalmon = await prisma.ingredient.create({
    data: { name: 'Wild Alaskan Smoked Salmon', currentStock: 1200, unit: 'grams', reorderThreshold: 300, costPerUnit: 0.06 },
  });

  const mangoPuree = await prisma.ingredient.create({
    data: { name: 'Tropical Mango Puree', currentStock: 3500, unit: 'ml', reorderThreshold: 700, costPerUnit: 0.009 },
  });

  const pistachioCream = await prisma.ingredient.create({
    data: { name: 'Handcrafted Pistachio Sweet Cream', currentStock: 2500, unit: 'ml', reorderThreshold: 500, costPerUnit: 0.02 },
  });

  const crushedPistachios = await prisma.ingredient.create({
    data: { name: 'Roasted Crushed Pistachios', currentStock: 1200, unit: 'grams', reorderThreshold: 300, costPerUnit: 0.035 },
  });

  console.log('✅ Created ingredients with stock levels');

  // 4. Create Suppliers
  await prisma.supplier.createMany({
    data: [
      {
        name: 'Apex Bean Roasters',
        contactPerson: 'David Miller',
        email: 'supply@apexbeans.com',
        phone: '+1 (555) 234-5678',
        category: 'Coffee Beans',
        address: '142 Roast Ave, Seattle, WA',
      },
      {
        name: 'Organic Valley Dairy Supply',
        contactPerson: 'Sarah Jenkins',
        email: 'orders@organicdairy.com',
        phone: '+1 (555) 876-5432',
        category: 'Dairy & Milks',
        address: '89 Farmstead Rd, Portland, OR',
      },
      {
        name: 'EcoPack Packaging Solutions',
        contactPerson: 'Alex Thorne',
        email: 'sales@ecopack.io',
        phone: '+1 (555) 432-1098',
        category: 'Cups & Utensils',
        address: '500 Green Way, San Francisco, CA',
      },
    ],
  });

  console.log('✅ Created suppliers');

  // 5. Create Menu Items & Recipes
  const espresso = await prisma.menuItem.create({
    data: {
      name: 'Double Shot Espresso',
      description: 'Rich, full-bodied extraction with notes of dark chocolate and toasted hazelnuts.',
      price: 3.50,
      category: 'Hot Coffee',
      image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: espressoBeans.id, quantityRequired: 18 },
          { ingredientId: cups.id, quantityRequired: 1 },
        ],
      },
    },
  });

  const icedLatte = await prisma.menuItem.create({
    data: {
      name: 'Artisan Iced Latte',
      description: 'Silky espresso combined with fresh cold milk served over handcrafted ice.',
      price: 4.80,
      category: 'Iced Coffee',
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: espressoBeans.id, quantityRequired: 18 },
          { ingredientId: wholeMilk.id, quantityRequired: 220 },
          { ingredientId: cups.id, quantityRequired: 1 },
        ],
      },
    },
  });

  const velvetCappuccino = await prisma.menuItem.create({
    data: {
      name: 'Velvet Cappuccino',
      description: 'Equal parts espresso, steamed milk, and dense micro-foam dusted with cocoa.',
      price: 4.50,
      category: 'Hot Coffee',
      image: 'https://images.unsplash.com/photo-1572442388796-11668ba67e53?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: espressoBeans.id, quantityRequired: 18 },
          { ingredientId: wholeMilk.id, quantityRequired: 180 },
          { ingredientId: cups.id, quantityRequired: 1 },
        ],
      },
    },
  });

  const matchaLatte = await prisma.menuItem.create({
    data: {
      name: 'Ceremonial Matcha Latte',
      description: 'First-harvest Uji matcha whisked to perfection with oat milk and honey touch.',
      price: 5.50,
      category: 'Specialty Teas',
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: matchaPowder.id, quantityRequired: 4 },
          { ingredientId: oatMilk.id, quantityRequired: 240 },
          { ingredientId: cups.id, quantityRequired: 1 },
        ],
      },
    },
  });

  const darkMocha = await prisma.menuItem.create({
    data: {
      name: 'Dark Chocolate Mocha',
      description: 'Signature espresso layered with artisanal Belgian dark chocolate and velvety milk.',
      price: 5.20,
      category: 'Hot Coffee',
      image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: espressoBeans.id, quantityRequired: 18 },
          { ingredientId: wholeMilk.id, quantityRequired: 200 },
          { ingredientId: chocolateSyrup.id, quantityRequired: 30 },
          { ingredientId: cups.id, quantityRequired: 1 },
        ],
      },
    },
  });

  const croissant = await prisma.menuItem.create({
    data: {
      name: 'Golden Butter Croissant',
      description: 'Flaky 81-layer French butter croissant baked fresh every morning.',
      price: 3.80,
      category: 'Bakery & Pastry',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: butter.id, quantityRequired: 40 },
        ],
      },
    },
  });

  const coldBrew = await prisma.menuItem.create({
    data: {
      name: 'Signature Nitro Cold Brew',
      description: 'Steeped for 20 hours and infused with nitrogen for a creamy, naturally sweet finish.',
      price: 5.00,
      category: 'Iced Coffee',
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: espressoBeans.id, quantityRequired: 25 },
          { ingredientId: cups.id, quantityRequired: 1 },
        ],
      },
    },
  });

  const caramelMacchiato = await prisma.menuItem.create({
    data: {
      name: 'Salted Caramel Macchiato',
      description: 'Freshly steamed milk with vanilla syrup, marked with espresso and topped with caramel drizzle.',
      price: 5.40,
      category: 'Hot Coffee',
      image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: espressoBeans.id, quantityRequired: 18 },
          { ingredientId: wholeMilk.id, quantityRequired: 200 },
          { ingredientId: vanillaSyrup.id, quantityRequired: 15 },
          { ingredientId: caramelSyrup.id, quantityRequired: 15 },
          { ingredientId: cups.id, quantityRequired: 1 },
        ],
      },
    },
  });

  const avocadoToast = await prisma.menuItem.create({
    data: {
      name: 'Artisanal Avocado Toast',
      description: 'Smashed Hass avocado on toasted sourdough with chili flakes, microgreens, and olive oil drizzle.',
      price: 7.50,
      category: 'Bakery & Pastry',
      image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: avocado.id, quantityRequired: 1 },
          { ingredientId: sourdough.id, quantityRequired: 1 },
        ],
      },
    },
  });

  const icedChai = await prisma.menuItem.create({
    data: {
      name: 'Spiced Iced Chai Latte',
      description: 'Black tea infused with cardamom, cinnamon, and ginger, blended with chilled milk.',
      price: 4.90,
      category: 'Specialty Teas',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: chaiConcentrate.id, quantityRequired: 100 },
          { ingredientId: oatMilk.id, quantityRequired: 150 },
          { ingredientId: cups.id, quantityRequired: 1 },
        ],
      },
    },
  });

  const spanishLatte = await prisma.menuItem.create({
    data: {
      name: 'Iced Spanish Latte',
      description: 'Rich espresso layered with fresh milk and sweet condensed milk served over ice.',
      price: 5.40,
      category: 'Iced Coffee',
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: espressoBeans.id, quantityRequired: 18 },
          { ingredientId: wholeMilk.id, quantityRequired: 150 },
          { ingredientId: condensedMilk.id, quantityRequired: 30 },
          { ingredientId: cups.id, quantityRequired: 1 },
        ],
      },
    },
  });

  const blueberryMuffin = await prisma.menuItem.create({
    data: {
      name: 'Wild Blueberry Almond Muffin',
      description: 'Moist golden muffin packed with organic wild blueberries and topped with toasted almond slices.',
      price: 4.20,
      category: 'Bakery & Pastry',
      image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: blueberries.id, quantityRequired: 30 },
          { ingredientId: almondFlakes.id, quantityRequired: 10 },
          { ingredientId: butter.id, quantityRequired: 25 },
        ],
      },
    },
  });

  const salmonBagel = await prisma.menuItem.create({
    data: {
      name: 'Smoked Salmon & Cream Cheese Bagel',
      description: 'Toasted everything bagel spread with whipped cream cheese, wild Alaskan smoked salmon, and fresh dill.',
      price: 8.90,
      category: 'Bakery & Pastry',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: bagels.id, quantityRequired: 1 },
          { ingredientId: creamCheese.id, quantityRequired: 40 },
          { ingredientId: smokedSalmon.id, quantityRequired: 50 },
        ],
      },
    },
  });

  const mangoSmoothie = await prisma.menuItem.create({
    data: {
      name: 'Tropical Mango Passion Smoothie',
      description: 'Velvety blend of ripe mangoes, passionfruit, and oat milk. Refreshing and 100% natural.',
      price: 6.20,
      category: 'Smoothies & Refreshers',
      image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: mangoPuree.id, quantityRequired: 180 },
          { ingredientId: oatMilk.id, quantityRequired: 100 },
          { ingredientId: cups.id, quantityRequired: 1 },
        ],
      },
    },
  });

  const hazelnutColdBrew = await prisma.menuItem.create({
    data: {
      name: 'Hazelnut Cold Foam Brew',
      description: '20-hour cold brew topped with handcrafted sweet hazelnut cold foam and vanilla syrup.',
      price: 5.60,
      category: 'Iced Coffee',
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: espressoBeans.id, quantityRequired: 25 },
          { ingredientId: wholeMilk.id, quantityRequired: 60 },
          { ingredientId: vanillaSyrup.id, quantityRequired: 15 },
          { ingredientId: cups.id, quantityRequired: 1 },
        ],
      },
    },
  });

  const pistachioColdBrew = await prisma.menuItem.create({
    data: {
      name: 'Pistachio Sweet Cream Cold Brew',
      description: 'Signature slow-steeped cold brew topped with silky handcrafted pistachio sweet cream and finished with roasted crushed pistachios.',
      price: 5.90,
      category: 'Iced Coffee',
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      recipe: {
        create: [
          { ingredientId: espressoBeans.id, quantityRequired: 25 },
          { ingredientId: pistachioCream.id, quantityRequired: 50 },
          { ingredientId: crushedPistachios.id, quantityRequired: 10 },
          { ingredientId: cups.id, quantityRequired: 1 },
        ],
      },
    },
  });

  console.log('✅ Created Menu Items with recipes');

  // 6. Create Seed Orders for Reports & Live Dashboard
  const sampleOrder1 = await prisma.order.create({
    data: {
      userId: customer.id,
      customerName: customer.name,
      tableNumber: 'Table 04',
      orderType: 'DINE_IN',
      status: 'COMPLETED',
      totalAmount: 9.60,
      items: {
        create: [
          { menuItemId: icedLatte.id, quantity: 1, unitPrice: 4.80 },
          { menuItemId: croissant.id, quantity: 1, unitPrice: 3.80 },
        ],
      },
    },
  });

  const sampleOrder2 = await prisma.order.create({
    data: {
      customerName: 'Liam Cooper',
      tableNumber: 'Table 09',
      orderType: 'DINE_IN',
      status: 'IN_PROGRESS',
      totalAmount: 11.00,
      items: {
        create: [
          { menuItemId: matchaLatte.id, quantity: 2, unitPrice: 5.50 },
        ],
      },
    },
  });

  const sampleOrder3 = await prisma.order.create({
    data: {
      userId: customer.id,
      customerName: 'Sophia Reed',
      phone: '+1 (555) 987-6543',
      deliveryAddress: '742 Evergreen Terrace, Apt 4B, Springfield, OR',
      deliveryNotes: 'Please ring bell and leave on front porch',
      deliveryFee: 3.50,
      tableNumber: 'Home Delivery',
      orderType: 'DELIVERY',
      status: 'OUT_FOR_DELIVERY',
      totalAmount: 16.40,
      items: {
        create: [
          { menuItemId: coldBrew.id, quantity: 1, unitPrice: 5.00 },
          { menuItemId: avocadoToast.id, quantity: 1, unitPrice: 7.50 },
        ],
      },
    },
  });

  console.log('✅ Created initial sample orders');
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
