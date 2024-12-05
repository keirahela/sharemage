const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const crypto = require('node:crypto')

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        const randomName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
        cb(null, randomName); // Append extension
    }
});

app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

const upload = multer({ storage: storage });

const fs = require('fs');
const uploadsDir = './uploads';

if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

app.get('/image', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'image.html'));
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const fileNameWithoutExtension = req.file.filename.split('.').slice(0, -1).join('.');
    res.send(`https://84ff-195-199-113-125.ngrok-free.app/uploads/image/${fileNameWithoutExtension}`);
});

app.use('/uploads', express.static('uploads'));

app.get('/uploads/image/:filename', (req, res) => {
    const filenameWithoutExtension = req.params.filename;
    const uploadsDir = path.join(__dirname, 'uploads');

    // Find any file in the directory that matches the base filename
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading uploads directory.');
        }

        const matchedFile = files.find(file => file.startsWith(filenameWithoutExtension));
        if (matchedFile) {
            const filePath = path.join(uploadsDir, matchedFile);
            const fileUrl = `https://84ff-195-199-113-125.ngrok-free.app/uploads/${matchedFile}`; // Full URL to the image

            // Use the original file name (with extension) for the title
            const originalFileName = matchedFile;
            res.set('Content-Type', 'text/html');
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${originalFileName}</title>
                    <meta property="og:title" content="${originalFileName}" />
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content="${fileUrl}" />
                    <meta property="og:image" content="${fileUrl}" />
                    <meta property="og:description" content="View the uploaded image: ${originalFileName}" />
                    <style>
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #f0f0f0;
                        }
                        .card {
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                            max-width: 600px;
                            text-align: center;
                            overflow: hidden;
                        }
                        .card img {
                            max-width: 100%;
                            height: auto;
                            border-bottom: 1px solid #ddd;
                        }
                        .card-title {
                            padding: 16px;
                            font-size: 24px;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <img src="/uploads/${matchedFile}" alt="Uploaded Image">
                        <div class="card-title">${originalFileName}</div>
                    </div>
                </body>
                </html>
            `);
        } else {
            res.status(404).send('Image not found.');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});