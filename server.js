require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { processUpload } = require('./googleDrive');

const app = express();

// Configure multer for handling file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 500 * 1024 * 1024, // 500MB per file (max for videos)
    files: 50 // Maximum 50 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow common image and video formats
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV, AVI) are allowed'), false);
    }
  }
});

// Serve static files from public directory
app.use(express.static('public'));

// Explicitly handle root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Basic error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'Fișier prea mare. Maxim 10MB pentru fotografii, 500MB pentru videoclipuri.' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false, 
        error: 'Prea multe fișiere. Maxim 50 de fișiere per încărcare.' 
      });
    }
  }
  if (error.message.includes('Only images') && error.message.includes('are allowed')) {
    return res.status(400).json({ 
      success: false, 
      error: 'Please upload supported file types: JPEG, PNG, GIF, WebP images or MP4, MOV, AVI videos.' 
    });
  }
  next(error);
});

// Upload endpoint
app.post('/upload', upload.array('photos', 50), async (req, res) => {
  try {
    console.log(`Received upload request with ${req.files?.length || 0} files`);
    
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No files uploaded' 
      });
    }
    
    // Process all files in parallel
    const results = await Promise.all(
      files.map(file => processUpload(file.buffer, file.originalname, file.mimetype))
    );
    
    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.length - successCount;
    
    console.log(`Upload completed: ${successCount} success, ${failureCount} failures`);
    
    if (successCount === 0) {
      return res.status(500).json({ 
        success: false, 
        error: 'All uploads failed' 
      });
    }
    
    let message = `${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully to Google Drive`;
    if (failureCount > 0) {
      message += `, ${failureCount} failed`;
    }
    
    res.json({ 
      success: true, 
      message: message,
      results: results
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed: ' + error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Robert & Adina Wedding Photo Uploader',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Event Photo Uploader server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to access the upload interface`);
}); 