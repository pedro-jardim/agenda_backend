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

//-->>Inicializa a configuração do Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') 
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), async (req, res) => {  
  try {
    const client = new ftp.Client();
    await client.access(ftpConfig);
    
    //-->> Configura a pasta destino 
    await client.ensureDir("/Arquivos")

    //-->> Define o local do arquivo de origem e o nome do arquivo originial
    await client.uploadFrom(req.file.path, req.file.originalname);
    await client.close();
    res.json({ message: 'Upload realizado com sucesso' });
  } catch (error) {
    console.error('FTP Error:', error);
    res.status(500).json({ error: 'Falha no Upload do FTP' });
  }
  console.log(req.file, 'req');
});

app.get('/download/:filename', (req, res) => {
  const fileName = req.params.filename;
  res.download(path.join(__dirname, 'uploads', fileName), (err) => {
    if (err) {
      res.status(404).json({ error: 'Arquivo não encontrado' });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});