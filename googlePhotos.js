const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize Google Auth with service account
let authClient;

async function initializeAuth() {
  if (!authClient) {
    const keyFilePath = path.resolve(__dirname, process.env.SERVICE_ACCOUNT_KEY);
    
    if (!fs.existsSync(keyFilePath)) {
      throw new Error(`Service account key file not found: ${keyFilePath}`);
    }
    
    // Read and parse the service account key
    const serviceAccountKey = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
    
    // Create JWT auth client
    authClient = new google.auth.JWT(
      serviceAccountKey.client_email,
      null,
      serviceAccountKey.private_key,
      [
        'https://www.googleapis.com/auth/photoslibrary.appendonly'
      ]
    );
    
    // Authorize the client
    await authClient.authorize();
    
    console.log('Google Photos API initialized successfully');
  }
  return { authClient };
}

// Upload a single photo to Google Photos and add to album
async function processUpload(buffer, filename, mimeType) {
  try {
    console.log(`Processing upload for: ${filename}`);
    
    const { authClient } = await initializeAuth();
    
    if (!process.env.ALBUM_ID) {
      throw new Error('ALBUM_ID environment variable not set');
    }
    
    // Step 1: Upload the raw bytes to get an upload token
    console.log(`Uploading raw bytes for: ${filename}`);
    
    const uploadResponse = await axios.post(
      'https://photoslibrary.googleapis.com/v1/uploads',
      buffer,
      {
        headers: {
          'Authorization': `Bearer ${(await authClient.getAccessToken()).token}`,
          'Content-Type': 'application/octet-stream',
          'X-Goog-Upload-Content-Type': mimeType,
          'X-Goog-Upload-Protocol': 'raw'
        }
      }
    );
    
    const uploadToken = uploadResponse.data;
    console.log(`Got upload token for: ${filename}`);
    
    // Step 2: Create media item in the album using the upload token
    console.log(`Creating media item for: ${filename}`);
    const createResponse = await axios.post(
      'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate',
      {
        albumId: process.env.ALBUM_ID,
        newMediaItems: [{
          description: `Uploaded via Event Photo Uploader: ${filename}`,
          simpleMediaItem: {
            fileName: filename,
            uploadToken: uploadToken
          }
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${(await authClient.getAccessToken()).token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const results = createResponse.data.newMediaItemResults;
    
    if (!results || results.length === 0) {
      throw new Error('No media item results returned');
    }
    
    const result = results[0];
    
    if (result.status && result.status.message !== 'Success') {
      throw new Error(`Upload failed: ${result.status.message}`);
    }
    
    console.log(`Successfully uploaded: ${filename} - Media ID: ${result.mediaItem?.id}`);
    
    return {
      filename,
      status: 'success',
      mediaItemId: result.mediaItem?.id,
      productUrl: result.mediaItem?.productUrl
    };
    
  } catch (error) {
    console.error(`Failed to upload ${filename}:`, error.message);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
      console.error('Error headers:', error.response.headers);
    }
    
    return {
      filename,
      status: 'error',
      error: error.message,
      details: error.response?.data
    };
  }
}

// Test function to verify API connection
async function testConnection() {
  try {
    const { photosLibrary } = await initializeAuth();
    
    // Try to get album information
    if (process.env.ALBUM_ID) {
      const album = await photosLibrary.albums.get({
        albumId: process.env.ALBUM_ID
      });
      
      console.log(`Connected to album: ${album.data.title}`);
      return { success: true, albumTitle: album.data.title };
    } else {
      console.log('Google Photos API connection successful, but no ALBUM_ID set');
      return { success: true, message: 'API connected, no album specified' };
    }
    
  } catch (error) {
    console.error('Google Photos API connection test failed:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  processUpload,
  testConnection
}; 