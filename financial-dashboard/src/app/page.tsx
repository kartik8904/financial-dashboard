// src/app/page.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import Link from "next/link";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  // Mock data - would come from your API in production
  const recentTransactions = [
    { id: "1", description: "Grocery Shopping", amount: 50.75, type: "EXPENSE", category: "Food", date: "Mar 1, 2025" },
    { id: "2", description: "Pharmacy", amount: 30.00, type: "EXPENSE", category: "Health", date: "Mar 2, 2025" },
    { id: "3", description: "Salary", amount: 5000.00, type: "INCOME", category: "Work", date: "Feb 28, 2025" },
  ];

  const categoryData = [
    { name: "Food", value: 850, color: "#FF8042" },
    { name: "Health", value: 300, color: "#00C49F" },
    { name: "Bills", value: 500, color: "#FFBB28" },
    { name: "Entertainment", value: 200, color: "#0088FE" },
  ];

  // Total calculations
  const totalIncome = 5200;
  const totalExpenses = 1850;
  const savings = totalIncome - totalExpenses;
  const savingsPercentage = Math.round((savings / totalIncome) * 100);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
    
    // Check for system dark mode preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
    
    // Listen for changes in color scheme preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      setDarkMode(event.matches);
    });
  }, [isLoaded, user, router]);

  if (!isLoaded) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.firstName || "User"}!</h1>
        <p className="text-gray-600 dark:text-gray-300">Here's an overview of your finances</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-500 dark:bg-green-600 text-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-white/80">Total Income</p>
              <h3 className="text-2xl font-bold">${totalIncome.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-red-500 dark:bg-red-600 text-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-white/80">Total Expenses</p>
              <h3 className="text-2xl font-bold">${totalExpenses.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-blue-500 dark:bg-blue-600 text-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-white/80">Total Savings</p>
              <h3 className="text-2xl font-bold">${savings.toLocaleString()}</h3>
              <p className="text-sm text-white/80">{savingsPercentage}% of income</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Charts and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Spending Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all">
          <h2 className="text-xl font-semibold mb-4">Spending Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <Link href="/transactions" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
              View All
            </Link>
          </div>
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium">{transaction.description}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{transaction.date}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-600">
                          {transaction.category}
                        </span>
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${
                        transaction.type === "EXPENSE" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                      }`}>
                        {transaction.type === "EXPENSE" ? "-" : "+"}${transaction.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/transactions?action=new" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center transition-all hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium">Add Transaction</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Record new expense or income</p>
          </div>
        </Link>

        <Link href="/categories?action=new" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center transition-all hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium">New Category</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create a spending category</p>
          </div>
        </Link>

        <Link href="/reports" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center transition-all hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium">View Reports</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">See insights and trends</p>
          </div>
        </Link>

        <Link href="/settings" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center transition-all hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-3 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium">Settings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Customize your preferences</p>
          </div>
        </Link>
      </div>
    </div>
  );
}