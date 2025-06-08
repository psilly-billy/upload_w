require('dotenv').config();
const { createFolder, testConnection } = require('./googleDrive');

async function setupDriveFolder() {
  console.log('🚀 Setting up Google Drive folder for Event Photo Uploader...\n');
  
  try {
    // Test connection first
    console.log('1. Testing Google Drive API connection...');
    const connectionTest = await testConnection();
    
    if (!connectionTest.success) {
      console.error('❌ Failed to connect to Google Drive API:');
      console.error(connectionTest.error);
      console.log('\nPlease check:');
      console.log('- Your service-account-key.json file exists');
      console.log('- Google Drive API is enabled in your Google Cloud project');
      console.log('- Your service account has the necessary permissions');
      return;
    }
    
    console.log('✅ Google Drive API connection successful!\n');
    
    // Create a new folder for the event
    console.log('2. Creating event photo folder...');
    
    const folderName = `Event Photos - ${new Date().toLocaleDateString()}`;
    const folderResult = await createFolder(folderName);
    
    if (!folderResult.success) {
      console.error('❌ Failed to create folder:');
      console.error(folderResult.error);
      return;
    }
    
    console.log('✅ Folder created successfully!\n');
    
    // Display results and next steps
    console.log('🎉 Setup Complete! Here are your details:\n');
    console.log('📁 Folder Name:', folderResult.folderName);
    console.log('🆔 Folder ID:', folderResult.folderId);
    console.log('🔗 Folder Link:', folderResult.folderLink);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Copy the Folder ID above');
    console.log('2. Add this line to your .env file:');
    console.log(`   FOLDER_ID=${folderResult.folderId}`);
    console.log('3. Start your server with: npm run dev');
    console.log('4. Share the folder link with event guests so they can view uploaded photos');
    
    console.log('\n💡 The folder is now:');
    console.log('✅ Publicly viewable (anyone with the link can see photos)');
    console.log('✅ Ready to receive uploads from your event photo uploader');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\nPlease check your configuration and try again.');
  }
}

// Run the setup
setupDriveFolder(); 