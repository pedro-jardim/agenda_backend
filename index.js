const express = require('express');
const multer = require('multer');
const path = require('path');
const ftp = require('basic-ftp');

const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config()

const ftpConfig = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
};

// Set storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Save uploaded files to the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
  }
});

// Initialize multer upload
const upload = multer({ storage: storage });

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {  
  try {
    const client = new ftp.Client();
    await client.access(ftpConfig);
    await client.uploadFrom(req.file.path, req.file.originalname);
    await client.close();
    res.json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error('FTP Error:', error);
    res.status(500).json({ error: 'Failed to upload file to FTP server' });
  }
  console.log(req.file, 'req');
});

// Download endpoint
app.get('/download/:filename', (req, res) => {
  const fileName = req.params.filename;
  res.download(path.join(__dirname, 'uploads', fileName), (err) => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});