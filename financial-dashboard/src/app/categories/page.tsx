'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, PieChart, BarChart, Filter, Download } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  count?: number; // Number of transactions using this category
  amount?: number; // Total amount across transactions
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Food', type: 'expense', color: '#FF9F43', count: 24, amount: 1850 },
    { id: '2', name: 'Health', type: 'expense', color: '#28C76F', count: 12, amount: 630 },
    { id: '3', name: 'Bills', type: 'expense', color: '#FFBB33', count: 8, amount: 1100 },
    { id: '4', name: 'Entertainment', type: 'expense', color: '#4884EE', count: 15, amount: 450 },
    { id: '5', name: 'Rent', type: 'expense', color: '#EA5455', count: 3, amount: 1500 },
    { id: '6', name: 'Transportation', type: 'expense', color: '#9C27B0', count: 18, amount: 320 },
    { id: '7', name: 'Salary', type: 'income', color: '#28C76F', count: 2, amount: 8500 },
    { id: '8', name: 'Freelance', type: 'income', color: '#4884EE', count: 4, amount: 1200 },
    { id: '9', name: 'Investments', type: 'income', color: '#795548', count: 6, amount: 450 },
    { id: '10', name: 'Gifts', type: 'income', color: '#FFBB33', count: 2, amount: 300 },
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Omit<Category, 'id'>>({
    name: '',
    type: 'expense',
    color: '#28C76F'
  });
  const [activeView, setActiveView] = useState<'expense' | 'income'>('expense');
  const [viewMode, setViewMode] = useState<'card' | 'chart'>('card');

  const colorOptions = [
    '#FF9F43', // Orange
    '#28C76F', // Green
    '#FFBB33', // Yellow
    '#4884EE', // Blue
    '#EA5455', // Red
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#795548', // Brown
  ];

  // Calculate total amounts for charts
  const expenseTotal = categories
    .filter(cat => cat.type === 'expense')
    .reduce((sum, cat) => sum + (cat.amount || 0), 0);
  
  const incomeTotal = categories
    .filter(cat => cat.type === 'income')
    .reduce((sum, cat) => sum + (cat.amount || 0), 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCategory({
      ...newCategory,
      [name]: value
    });
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setNewCategory({
      name: '',
      type: activeView,
      color: '#28C76F'
    });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      type: category.type,
      color: category.color
    });
    setShowModal(true);
  };

  const handleSaveCategory = () => {
    if (newCategory.name.trim() === '') return;

    if (editingCategory) {
      // Update existing category
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, ...newCategory } 
          : cat
      ));
    } else {
      // Add new category
      const newId = Date.now().toString();
      setCategories([...categories, { 
        id: newId, 
        ...newCategory, 
        count: 0, 
        amount: 0 
      }]);
    }
    
    setShowModal(false);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  // Function to render SVG pie chart
  const renderPieChart = (type: 'expense' | 'income') => {
    const filteredCategories = categories.filter(cat => cat.type === type);
    const total = type === 'expense' ? expenseTotal : incomeTotal;
    
    let startAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    
    return (
      <svg width="200" height="200" viewBox="0 0 200 200">
        {filteredCategories.map((category, index) => {
          const percentage = ((category.amount || 0) / total) * 100;
          const angle = (percentage / 100) * 360;
          const endAngle = startAngle + angle;
          
          // Calculate path
          const startRad = (startAngle - 90) * (Math.PI / 180);
          const endRad = (endAngle - 90) * (Math.PI / 180);
          
          const x1 = centerX + radius * Math.cos(startRad);
          const y1 = centerY + radius * Math.sin(startRad);
          const x2 = centerX + radius * Math.cos(endRad);
          const y2 = centerY + radius * Math.sin(endRad);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX},${centerY}`,
            `L ${x1},${y1}`,
            `A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2}`,
            'Z'
          ].join(' ');
          
          const result = (
            <path
              key={category.id}
              d={pathData}
              fill={category.color}
              stroke="#fff"
              strokeWidth="1"
            />
          );
          
          startAngle = endAngle;
          return result;
        })}
      </svg>
    );
  };

  // Function to render SVG bar chart
  const renderBarChart = (type: 'expense' | 'income') => {
    const filteredCategories = categories
      .filter(cat => cat.type === type)
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 5); // Top 5 categories
    
    const maxAmount = Math.max(...filteredCategories.map(cat => cat.amount || 0));
    const barWidth = 30;
    const gap = 15;
    const height = 150;
    const width = filteredCategories.length * (barWidth + gap);
    
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {filteredCategories.map((category, index) => {
          const barHeight = ((category.amount || 0) / maxAmount) * (height - 30);
          const x = index * (barWidth + gap);
          const y = height - barHeight;
          
          return (
            <g key={category.id}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={category.color}
                rx="4"
              />
              <text
                x={x + barWidth / 2}
                y={height - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#333"
              >
                {category.name.substring(0, 6)}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#333"
              >
                ${category.amount}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col space-y-6">
        {/* Header with Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Categories</h1>
            <div className="flex items-center gap-4">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1 rounded-md ${viewMode === 'card' ? 'bg-white shadow' : ''}`}
                >
                  Cards
                </button>
                <button 
                  onClick={() => setViewMode('chart')}
                  className={`px-3 py-1 rounded-md ${viewMode === 'chart' ? 'bg-white shadow' : ''}`}
                >
                  Charts
                </button>
              </div>
              <button 
                onClick={openAddModal}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                <PlusCircle size={18} />
                Add Category
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 flex flex-col">
              <span className="text-blue-600 text-sm font-medium">Total Categories</span>
              <span className="text-2xl font-bold">{categories.length}</span>
              <div className="mt-2 text-sm">
                <span className="text-gray-500">{categories.filter(c => c.type === 'expense').length} expense, </span>
                <span className="text-gray-500">{categories.filter(c => c.type === 'income').length} income</span>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 flex flex-col">
              <span className="text-green-600 text-sm font-medium">Total Income</span>
              <span className="text-2xl font-bold">${incomeTotal.toLocaleString()}</span>
              <div className="mt-2 text-sm">
                <span className="text-gray-500">Across {categories.filter(c => c.type === 'income').reduce((sum, cat) => sum + (cat.count || 0), 0)} transactions</span>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 flex flex-col">
              <span className="text-red-600 text-sm font-medium">Total Expenses</span>
              <span className="text-2xl font-bold">${expenseTotal.toLocaleString()}</span>
              <div className="mt-2 text-sm">
                <span className="text-gray-500">Across {categories.filter(c => c.type === 'expense').reduce((sum, cat) => sum + (cat.count || 0), 0)} transactions</span>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 flex flex-col">
              <span className="text-purple-600 text-sm font-medium">Net Balance</span>
              <span className="text-2xl font-bold">${(incomeTotal - expenseTotal).toLocaleString()}</span>
              <div className="mt-2 text-sm">
                <span className={incomeTotal > expenseTotal ? "text-green-500" : "text-red-500"}>
                  {incomeTotal > expenseTotal ? "Positive" : "Negative"} balance
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Expense/Income */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveView('expense')}
            className={`py-2 px-4 font-medium ${
              activeView === 'expense'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Expense Categories
          </button>
          <button
            onClick={() => setActiveView('income')}
            className={`py-2 px-4 font-medium ${
              activeView === 'income'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Income Categories
          </button>
        </div>

        {viewMode === 'chart' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distribution Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Distribution</h2>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-gray-500 hover:text-gray-700">
                    <Download size={16} />
                  </button>
                </div>
              </div>
              <div className="flex justify-center items-center h-52">
                {renderPieChart(activeView)}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categories
                  .filter(cat => cat.type === activeView)
                  .map(category => (
                    <div key={category.id} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{category.name}</span>
                      <span className="text-sm text-gray-400 ml-auto">
                        {(((category.amount || 0) / (activeView === 'expense' ? expenseTotal : incomeTotal)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Top Categories</h2>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-gray-500 hover:text-gray-700">
                    <Filter size={16} />
                  </button>
                </div>
              </div>
              <div className="flex justify-center items-center h-52">
                {renderBarChart(activeView)}
              </div>
              <div className="mt-4">
                <div className="text-sm text-center text-gray-500">
                  Showing top 5 {activeView} categories by amount
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories
              .filter(cat => cat.type === activeView)
              .map(category => (
                <div 
                  key={category.id} 
                  className="bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden"
                >
                  <div 
                    className="h-2" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{category.name}</h3>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => openEditModal(category)}
                          className="p-1 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Transactions</span>
                      <span className="font-medium">{category.count}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Amount</span>
                      <span className="font-medium">${category.amount?.toLocaleString()}</span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>% of {category.type === 'expense' ? 'expenses' : 'income'}</span>
                        <span>
                          {(((category.amount || 0) / (category.type === 'expense' ? expenseTotal : incomeTotal)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="h-1.5 rounded-full" 
                          style={{ 
                            width: `${((category.amount || 0) / (category.type === 'expense' ? expenseTotal : incomeTotal)) * 100}%`,
                            backgroundColor: category.color 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal for adding/editing categories */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newCategory.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Groceries"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  name="type"
                  value={newCategory.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(color => (
                    <div
                      key={color}
                      onClick={() => setNewCategory({...newCategory, color})}
                      className={`w-8 h-8 rounded-full cursor-pointer ${
                        newCategory.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}