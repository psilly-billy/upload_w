# Event Photo Uploader

A web-based middleware solution that allows event guests to upload photos and videos directly to a shared Google Drive folder via QR code scanning, without requiring Google accounts or app installations.

## 🎯 Features

- **No Guest Authentication Required**: Guests just scan QR code and upload
- **Direct Google Drive Integration**: Files go straight to shared folder
- **Mobile-Friendly Interface**: Optimized for phones and tablets
- **Drag & Drop Support**: Easy file selection and upload
- **Real-time Progress**: Visual feedback during uploads
- **File Validation**: Images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV, AVI) with size limits
- **Responsive Design**: Works on all device sizes

## 🚀 Quick Start

### Prerequisites

1. **Google Cloud Project** with Drive API enabled
2. **Service Account** with appropriate permissions  
3. **Google Drive Folder** created and shared
4. **Node.js 16+** installed locally

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd event-photo-uploader
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.template .env
   # Edit .env with your actual values
   ```

3. **Add your service account key:**
   ```bash
   # Place your service-account-key.json in the project root
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000** to test the interface

## 🔧 Configuration

### Google Cloud Setup

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing one

2. **Enable Google Photos Library API:**
   - Navigate to APIs & Services > Library
   - Search for "Photos Library API"
   - Click Enable

3. **Create Service Account:**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "Service Account"
   - Download the JSON key file as `service-account-key.json`

4. **Set up OAuth 2.0 (if needed):**
   - Create OAuth 2.0 Client ID
   - Add authorized domains for production

### Google Photos Setup

1. **Create Shared Album:**
   - Open Google Photos
   - Create new album
   - Make it shareable
   - Copy the Album ID from URL: `https://photos.google.com/album/<ALBUM_ID>`

2. **Grant Access to Service Account:**
   - Share the album with your service account email
   - Give "Add photos" permission

### Environment Variables

Copy `env.template` to `.env` and fill in:

```env
# Google OAuth Credentials
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret

# Google Photos Album
ALBUM_ID=your_album_id_from_url

# Service Account
SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com
SERVICE_ACCOUNT_KEY=./service-account-key.json

# Server
PORT=3000
```

## 🚀 Deployment

### Heroku Deployment

1. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set CLIENT_ID=your_id
   heroku config:set CLIENT_SECRET=your_secret
   heroku config:set ALBUM_ID=your_album_id
   heroku config:set SERVICE_ACCOUNT_EMAIL=your@service.email
   heroku config:set SERVICE_ACCOUNT_KEY=./service-account-key.json
   ```

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

4. **Upload service account key:**
   ```bash
   # Use Heroku CLI to upload the key file
   heroku ps:copy service-account-key.json
   ```

### Other Deployment Options

- **Google Cloud Run**: For auto-scaling
- **Vercel**: For edge deployment
- **Railway**: Alternative to Heroku

## 📱 Creating QR Code

1. **Get your app URL** (e.g., `https://your-app.herokuapp.com`)

2. **Generate QR code** using:
   - [QRCode Monkey](https://www.qrcode-monkey.com/)
   - [QRickit](https://qrickit.com/)
   - Any QR generator

3. **QR Code Settings:**
   - Content Type: URL
   - Size: Minimum 500x500px
   - Error Correction: High
   - Format: PNG or SVG

4. **Print and display** at your event location

## 🔒 Security Features

- **File Type Validation**: Only JPEG images allowed
- **File Size Limits**: 10MB per file, 10 files per upload
- **Server-side Authentication**: All Google API calls use service account
- **No Guest Data Storage**: Files go directly to Google Photos
- **Input Sanitization**: Filename and content validation

## 🛠️ Development

### Available Scripts

```bash
npm start        # Production server
npm run dev      # Development with nodemon
npm test         # Run tests (if added)
```

### Project Structure

```
event-photo-uploader/
├── public/              # Frontend files
│   ├── index.html      # Main upload interface
│   └── style.css       # Responsive styles
├── server.js           # Express server
├── googlePhotos.js     # Google Photos API helper
├── package.json        # Dependencies
├── Procfile           # Heroku config
├── env.template       # Environment variables template
└── README.md          # This file
```

### Testing Locally

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Test upload flow:**
   - Open http://localhost:3000
   - Select JPEG images
   - Verify they appear in Google Photos album

3. **Test mobile interface:**
   - Use browser dev tools
   - Test drag & drop functionality
   - Verify responsive design

## 📊 Monitoring & Analytics

### Health Check

The app includes a health check endpoint:
```
GET /health
```

Returns server status and timestamp.

### Logging

- All uploads logged to console
- Error tracking included
- Consider adding Sentry for production

### Usage Analytics

Consider adding:
- Google Analytics for page views
- Custom metrics for upload success rates
- Error tracking and alerting

## 🚨 Troubleshooting

### Common Issues

1. **"Service account key not found"**
   - Ensure `service-account-key.json` is in project root
   - Check file permissions
   - Verify path in `.env`

2. **"Album not found"**
   - Check Album ID in environment variables
   - Ensure service account has access to album
   - Verify album is shared properly

3. **Upload failures**
   - Check Google Photos API quotas
   - Verify service account permissions
   - Check file formats (JPEG only)

4. **Mobile issues**
   - Test on actual devices
   - Check file size limits
   - Verify drag & drop alternatives

### Getting Help

- Check browser console for errors
- Review server logs
- Test with sample JPEG files
- Verify all environment variables are set

## 📝 License

MIT License - feel free to use for your events!

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues or questions:
- Create GitHub issue
- Check troubleshooting section
- Review Google Photos API documentation 