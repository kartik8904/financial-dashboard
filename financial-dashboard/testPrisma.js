// testPrisma.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabase() {
  try {
    // Test fetching users
    const users = await prisma.user.findMany();
    console.log('Users:', users);

    // Test fetching categories
    const categories = await prisma.category.findMany();
    console.log('Categories:', categories);

    // Test fetching transactions
    const transactions = await prisma.transaction.findMany();
    console.log('Transactions:', transactions);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();