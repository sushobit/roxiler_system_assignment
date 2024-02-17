const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3001;

// Define a data structure for your database
let database = [];

// API to initialize the database with seed data
app.get('/api/initialize-database', async (req, res) => {
  try {
    // Fetch data from the third-party API
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const seedData = response.data;

    // Initialize the database with seed data
    database = seedData;

    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// API to list all transactions with search and pagination
app.get('/api/transactions', (req, res) => {
  const { search, page = 1, perPage = 10 } = req.query;

  // Filter data based on search parameter
  const filteredData = database.filter(item => {
    const searchTerms = [item.title, item.description, item.price.toString()];
    return searchTerms.some(term => term.toLowerCase().includes(search.toLowerCase()));
  });

  // Apply pagination
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  res.json({ success: true, data: paginatedData });
});

// API for statistics
app.get('/api/statistics/:month', (req, res) => {
  const monthToMatch = req.params.month.toLowerCase();

  // Filter data based on the provided month
  const filteredData = database.filter(item => {
    const dateOfSale = new Date(item.dateOfSale);
    return dateOfSale.toLocaleString('default', { month: 'long' }).toLowerCase() === monthToMatch;
  });

  // Calculate statistics
  const totalSaleAmount = filteredData.reduce((sum, item) => sum + item.price, 0);
  const totalSoldItems = filteredData.length;
  const totalNotSoldItems = database.length - totalSoldItems;

  res.json({
    success: true,
    statistics: {
      totalSaleAmount,
      totalSoldItems,
      totalNotSoldItems,
    },
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
