// This script serves as a bridge between the Express server and our FastAPI + Next.js setup

const express = require('express');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');

// Start FastAPI backend
console.log('🐍 Starting FastAPI backend...');
const fastapi = spawn('python', ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit', // inherit stdout/stderr
});

fastapi.on('close', (code) => {
  console.log(`FastAPI backend process exited with code ${code}`);
});

// Create Express server as the primary entrypoint
const app = express();
const port = 5000;

// Proxy to FastAPI backend
app.use('/api', async (req, res) => {
  const url = `http://localhost:8000${req.url}`;
  const method = req.method.toLowerCase();
  
  console.log(`Proxying ${method.toUpperCase()} ${req.url} to FastAPI backend`);
  
  try {
    const axiosConfig = {
      method,
      url,
      headers: req.headers,
      params: req.query,
    };
    
    // Add body for POST/PUT/etc requests
    if (['post', 'put', 'patch'].includes(method)) {
      axiosConfig.data = req.body;
    }
    
    const response = await axios(axiosConfig);
    
    // Forward response from FastAPI
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Error proxying to FastAPI: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to connect to backend service',
      details: error.message
    });
  }
});

// Serve static Express-based frontend as a fallback
app.use(express.static(path.join(__dirname, 'public')));

// Start Express server
const server = http.createServer(app);
server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Express server running on port ${port}`);
  console.log('🔄 Backend and frontend integration ready');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down services...');
  fastapi.kill();
  server.close(() => {
    console.log('Express server closed');
    process.exit(0);
  });
});