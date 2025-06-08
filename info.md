# Event Photo Uploader to Google Photos

## Project Overview
Create a web-based middleware solution allowing guests to upload photos to a shared Google Photos album via QR code without requiring:
- Google Photos app installation
- Google accounts for guests
- Complex authentication flows

## Technical Stack
Frontend: HTML/CSS/JavaScript
Backend: Node.js (Express)
Google API: Google Photos Library API
Storage: Google Cloud Platform
Hosting: Heroku (free tier)
QR Code: Static QR pointing to hosted URL


## Implementation Flow
```mermaid
sequenceDiagram
    Guest->>Web Interface: Scan QR Code
    Web Interface->>Guest: Show Upload Form
    Guest->>Web Interface: Select & Submit Photos
    Web Interface->>Backend: POST /upload
    Backend->>Google Photos API: Upload with Service Account
    Google Photos API->>Shared Album: Add Media Items
    Backend->>Web Interface: Success/Failure Response
    Web Interface->>Guest: Upload Confirmation
Setup Steps
1. Google Cloud Configuration
Create Google Cloud Project at console.cloud.google.com
Enable "Google Photos Library API"
Create OAuth 2.0 Client ID (Web Application)
Create Service Account with "Owner" permissions
Download JSON credentials file
2. Google Photos Setup
Create shared album in Google Photos
Note Album ID from URL: https://photos.google.com/album/<ALBUM_ID>
Grant write access to service account email
3. Project Structure
/event-photo-uploader
  ├── public/           - Frontend files
  │    ├── index.html   - Upload form
  │    └── style.css    - Custom styles
  ├── .env              - Environment variables
  ├── server.js         - Main backend
  ├── googlePhotos.js   - Google API helper
  └── package.json
4. Required Environment Variables (.env)
ini
Copy Code
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
ALBUM_ID=your_google_photos_album_id
SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
SERVICE_ACCOUNT_KEY=./service-account-key.json
PORT=3000
5. Backend Implementation (server.js)
javascript
Copy Code
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { processUpload } = require('./googlePhotos');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Serve static files
app.use(express.static('public'));

// Upload endpoint
app.post('/upload', upload.array('photos', 10), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).send('No files uploaded');
    }
    
    const results = await Promise.all(
      files.map(file => processUpload(file.buffer, file.originalname))
    );
    
    res.json({ 
      success: true, 
      message: `${results.length} photos uploaded to album` 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
6. Google Photos Helper (googlePhotos.js)
javascript
Copy Code
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Initialize Google Auth
const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve(__dirname, process.env.SERVICE_ACCOUNT_KEY),
  scopes: ['https://www.googleapis.com/auth/photoslibrary']
});

// Process file upload
async function processUpload(buffer, filename) {
  const photosLibrary = google.photoslibrary({ version: 'v1', auth });
  
  // Upload media
  const uploadToken = await photosLibrary.mediaItems.upload({
    requestBody: {
      albumId: process.env.ALBUM_ID,
      newMediaItems: [{
        simpleMediaItem: {
          uploadToken: null // Will be set by API
        }
      }]
    },
    media: {
      mimeType: 'image/jpeg',
      body: buffer
    }
  });
  
  // Add to album
  await photosLibrary.albums.addEnrichment({
    albumId: process.env.ALBUM_ID,
    requestBody: {
      newEnrichmentItem: {
        mediaItem: {
          id: uploadToken.data.newMediaItemResults[0].mediaItem.id
        }
      },
      albumPosition: {
        position: "LAST_IN_ALBUM"
      }
    }
  });

  return { filename, status: 'success' };
}

module.exports = { processUpload };
7. Frontend Interface (public/index.html)
html
Copy Code
<!DOCTYPE html>
<html>
<head>
  <title>Event Photo Upload</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --primary: #4285f4;
      --success: #34a853;
    }
    body {
      font-family: 'Roboto', sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .upload-container {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      margin: 30px 0;
      transition: all 0.3s;
    }
    .upload-container.drag-over {
      border-color: var(--primary);
      background-color: #f8fbff;
    }
    .btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s;
    }
    .btn:hover {
      background: #3367d6;
    }
    .progress-bar {
      height: 8px;
      background: #f1f1f1;
      border-radius: 4px;
      margin: 20px 0;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--success);
      width: 0%;
      transition: width 0.4s;
    }
    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <h1>Share Your Event Photos</h1>
  <p>Select or drag photos to upload directly to our shared album</p>
  
  <div class="upload-container" id="dropZone">
    <input type="file" id="fileInput" multiple accept="image/*" class="hidden">
    <p>Drag & drop photos here or</p>
    <button class="btn" id="selectBtn">Select Photos</button>
    <p>Maximum 10 photos per upload (JPEG only)</p>
  </div>
  
  <div class="progress-bar hidden" id="progressBar">
    <div class="progress-fill" id="progressFill"></div>
  </div>
  
  <div id="messageContainer"></div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const fileInput = document.getElementById('fileInput');
      const selectBtn = document.getElementById('selectBtn');
      const dropZone = document.getElementById('dropZone');
      const progressBar = document.getElementById('progressBar');
      const progressFill = document.getElementById('progressFill');
      const messageContainer = document.getElementById('messageContainer');
      
      // Trigger file selection
      selectBtn.addEventListener('click', () => fileInput.click());
      
      // Handle file selection
      fileInput.addEventListener('change', handleFiles);
      
      // Drag and drop handlers
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
      });
      
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
      });
      
      dropZone.addEventListener('drop', handleDrop, false);
      
      function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      function highlight() {
        dropZone.classList.add('drag-over');
      }
      
      function unhighlight() {
        dropZone.classList.remove('drag-over');
      }
      
      function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files } });
      }
      
      async function handleFiles(e) {
        const files = Array.from(e.target.files);
        
        // Basic validation
        if (files.length > 10) {
          showMessage('Maximum 10 photos per upload', 'error');
          return;
        }
        
        const validFiles = files.filter(file => 
          file.type.startsWith('image/') && 
          (file.type.endsWith('jpeg') || file.type.endsWith('jpg'))
        );
        
        if (validFiles.length === 0) {
          showMessage('Please select JPEG images only', 'error');
          return;
        }
        
        // Show progress
        progressBar.classList.remove('hidden');
        progressFill.style.width = '0%';
        
        try {
          const formData = new FormData();
          validFiles.forEach(file => formData.append('photos', file));
          
          const response = await fetch('/upload', {
            method: 'POST',
            body: formData
          });
          
          const result = await response.json();
          
          if (result.success) {
            showMessage(result.message, 'success');
          } else {
            showMessage(`Upload failed: ${result.error}`, 'error');
          }
        } catch (error) {
          showMessage(`Network error: ${error.message}`, 'error');
        } finally {
          // Reset form
          fileInput.value = '';
          progressBar.classList.add('hidden');
        }
      }
      
      function showMessage(text, type) {
        messageContainer.innerHTML = `<p class="message ${type}">${text}</p>`;
      }
    });
  </script>
</body>
</html>
8. Deployment to Heroku
Create Procfile in project root:
web: node server.js
Required packages:
bash
Copy Code
npm install express multer googleapis dotenv
Deployment steps:
bash
Copy Code
# Initialize Git repo
git init
git add .
git commit -m "Initial commit"

# Create Heroku app
heroku create
heroku config:set CLIENT_ID=your_id CLIENT_SECRET=your_secret ALBUM_ID=your_album_id SERVICE_ACCOUNT_EMAIL=your@service.email

# Push to Heroku
git push heroku main
9. QR Code Generation
Get your Heroku app URL: https://your-app-name.herokuapp.com
Generate QR code using free tools:
QRCode Monkey
QRickit
Important settings:
Content Type: URL
Size: Minimum 500x500px
Error Correction: High (for better scan reliability)
10. Post-Deployment Checklist
 Test upload flow from mobile devices
 Verify photos appear in Google Photos album
 Add file size limit (recommend 10MB per file)
 Implement rate limiting (express-rate-limit)
 Add basic password protection if needed
 Set up Heroku auto-deploy from GitHub
 Create error logging (Sentry or console.log)
11. Scalability Considerations
Implement queuing system (Redis) for large events
Add Cloud Storage intermediate bucket for large files
Use Google Cloud Run instead of Heroku for auto-scaling
Add load balancing with multiple instances
Implement file chunking for large uploads
12. Security Enhancements
Add CSRF protection (csurf package)
Implement CORS restrictions
Add file type verification (magic bytes)
Set upload size limits:
javascript
Copy Code
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
Add basic authentication middleware

This comprehensive guide includes:
1. Complete backend configuration with service account auth
2. Mobile-friendly frontend with drag-and-drop
3. Deployment instructions for Heroku
4. QR code generation steps
5. Security and scalability considerations
6. Error handling and user feedback

To get started:
1. Create project directory with the structure above
2. Install dependencies: `npm install express multer googleapis dotenv`
3. Set up Google Cloud credentials
4. Create shared album in Google Photos
5. Start local server: `node server.js`
6. Test at `http://localhost:3000`

The solution handles all authentication server-side using service accounts, so guests only interact with a simple web interface.