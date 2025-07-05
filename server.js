const express = require('express');
const dotenv = require('dotenv');
const submissionRoutes = require('./routes/submissionsRoutes');
const db = require('./model/db')
const exportRoutes = require('./routes/exportRoutes');
const app = express();
const downloadRoutes = require('./routes/downloadRoutes');

dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', downloadRoutes);
app.use('/api', submissionRoutes);
app.use('/api', exportRoutes);
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({ error: 'Request timed out' });
  });
  next();
});


db.query('SELECT 1', (err) => {
    if (err) {
      console.error('❌ Database connection failed:', err.message);
      process.exit(1); 
    }
  
    console.log('✅ Database connected successfully');
  
    app.listen(process.env.PORT || 3001, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
    });
  });
  