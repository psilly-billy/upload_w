const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Initialize Google Auth with service account
let authClient;
let driveService;

async function initializeAuth() {
  if (!authClient) {
    const keyFilePath = path.resolve(__dirname, process.env.SERVICE_ACCOUNT_KEY);
    
    if (!fs.existsSync(keyFilePath)) {
      throw new Error(`Service account key file not found: ${keyFilePath}`);
    }
    
    // Read and parse the service account key
    const serviceAccountKey = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
    
    // Create JWT auth client with Google Drive scopes
    authClient = new google.auth.JWT(
      serviceAccountKey.client_email,
      null,
      serviceAccountKey.private_key,
      [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive'
      ]
    );
    
    // Authorize the client
    await authClient.authorize();
    
    // Initialize Drive service
    driveService = google.drive({ version: 'v3', auth: authClient });
    
    console.log('Google Drive API initialized successfully');
  }
  return { authClient, driveService };
}

// Upload a single file to Google Drive folder
async function processUpload(buffer, filename, mimeType) {
  try {
    console.log(`Processing upload for: ${filename}`);
    
    const { driveService } = await initializeAuth();
    
    if (!process.env.FOLDER_ID) {
      throw new Error('FOLDER_ID environment variable not set');
    }
    
    // Prepare file metadata
    const fileMetadata = {
      name: filename,
      parents: [process.env.FOLDER_ID], // Upload to specific folder
      description: `Uploaded via Event Photo Uploader at ${new Date().toISOString()}`
    };
    
    // Prepare media object
    const media = {
      mimeType: mimeType,
      body: require('stream').Readable.from(buffer)
    };
    
    console.log(`Uploading to Google Drive: ${filename}`);
    
    // Upload file to Google Drive
    const response = await driveService.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink, size, createdTime'
    });
    
    const file = response.data;
    
    console.log(`Successfully uploaded: ${filename} - File ID: ${file.id}`);
    
    // Make the file publicly viewable (optional)
    try {
      await driveService.permissions.create({
        fileId: file.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
      console.log(`File ${filename} is now publicly accessible`);
    } catch (permError) {
      console.warn(`Could not make file public: ${permError.message}`);
    }
    
    return {
      filename,
      status: 'success',
      fileId: file.id,
      name: file.name,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
      size: file.size,
      createdTime: file.createdTime
    };
    
  } catch (error) {
    console.error(`Failed to upload ${filename}:`, error.message);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    }
    
    return {
      filename,
      status: 'error',
      error: error.message,
      details: error.response?.data
    };
  }
}

// Test function to verify API connection and folder access
async function testConnection() {
  try {
    const { driveService } = await initializeAuth();
    
    // Try to get folder information
    if (process.env.FOLDER_ID) {
      const folder = await driveService.files.get({
        fileId: process.env.FOLDER_ID,
        fields: 'id, name, webViewLink, permissions'
      });
      
      console.log(`Connected to Drive folder: ${folder.data.name}`);
      return { 
        success: true, 
        folderName: folder.data.name,
        folderId: folder.data.id,
        folderLink: folder.data.webViewLink
      };
    } else {
      console.log('Google Drive API connection successful, but no FOLDER_ID set');
      return { success: true, message: 'Drive API connected, no folder specified' };
    }
    
  } catch (error) {
    console.error('Google Drive API connection test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to create a new folder (useful for setup)
async function createFolder(folderName, parentFolderId = null) {
  try {
    const { driveService } = await initializeAuth();
    
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }
    
    const response = await driveService.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, webViewLink'
    });
    
    const folder = response.data;
    
    // Make folder publicly accessible
    await driveService.permissions.create({
      fileId: folder.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    console.log(`Created folder: ${folder.name} (ID: ${folder.id})`);
    console.log(`Folder link: ${folder.webViewLink}`);
    
    return {
      success: true,
      folderId: folder.id,
      folderName: folder.name,
      folderLink: folder.webViewLink
    };
    
  } catch (error) {
    console.error('Failed to create folder:', error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to list files in the folder
async function listFiles() {
  try {
    const { driveService } = await initializeAuth();
    
    if (!process.env.FOLDER_ID) {
      throw new Error('FOLDER_ID environment variable not set');
    }
    
    const response = await driveService.files.list({
      q: `'${process.env.FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name, webViewLink, createdTime, size, mimeType)',
      orderBy: 'createdTime desc'
    });
    
    return {
      success: true,
      files: response.data.files,
      count: response.data.files.length
    };
    
  } catch (error) {
    console.error('Failed to list files:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  processUpload,
  testConnection,
  createFolder,
  listFiles
}; 