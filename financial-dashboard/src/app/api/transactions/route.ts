import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fallback UUID generation if the package fails
function generateFallbackId() {
  return 'manual-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
}

// Handle UUID import with fallback
let uuidv4: () => string;
try {
  const { v4 } = require('uuid');
  uuidv4 = v4;
} catch (error) {
  console.warn('UUID package not available, using fallback ID generation');
  uuidv4 = generateFallbackId;
}

// Define transaction type for type safety
type TransactionType = "INCOME" | "EXPENSE";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, description, category, amount, type } = body;
    
    if (!userId || !description || !category || amount === undefined || !type) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    
    // Validate and convert type to proper format
    const upperCaseType = type.toUpperCase();
    if (upperCaseType !== "INCOME" && upperCaseType !== "EXPENSE") {
      return NextResponse.json({ message: "Invalid type. Must be INCOME or EXPENSE" }, { status: 400 });
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        id: uuidv4(), // Generate UUID for the transaction
        userId,
        description,
        category,
        amount: parseFloat(amount.toString()), // Ensure amount is a number
        type: upperCaseType as TransactionType, // Cast to the correct type
      },
    });
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Transaction POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    const transactions = await prisma.transaction.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    
    // Format dates as ISO strings to ensure they can be properly parsed by the frontend
    const formattedTransactions = transactions.map(tx => ({
      ...tx,
      createdAt: tx.createdAt.toISOString()
    }));
    
    return NextResponse.json(formattedTransactions, { status: 200 });
  } catch (error) {
    console.error("Transaction GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ message: "Transaction ID is required" }, { status: 400 });
    }
    
    const body = await req.json();
    const { description, category, amount, type } = body;
    
    if (!description || !category || amount === undefined || !type) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    
    // Validate type
    const upperCaseType = type.toUpperCase();
    if (upperCaseType !== "INCOME" && upperCaseType !== "EXPENSE") {
      return NextResponse.json({ message: "Invalid type. Must be INCOME or EXPENSE" }, { status: 400 });
    }
    
    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    });
    
    if (!existingTransaction) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
    }
    
    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        description,
        category,
        amount: parseFloat(amount.toString()),
        type: upperCaseType as TransactionType,
      },
    });
    
    return NextResponse.json(updatedTransaction, { status: 200 });
  } catch (error) {
    console.error("Transaction PUT Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ message: "Transaction ID is required" }, { status: 400 });
    }
    
    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    });
    
    if (!existingTransaction) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
    }
    
    // Delete transaction
    await prisma.transaction.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: "Transaction deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Transaction DELETE Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}