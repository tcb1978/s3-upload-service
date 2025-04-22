import AWS from 'aws-sdk';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import multer from 'multer';

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
});

app.post('/upload', upload.single('file'), (req: Request, res: Response): void => {
  const file = req.file;
  if (!file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  if (!process.env.AWS_BUCKET_NAME) {
    res.status(500).send('AWS_BUCKET_NAME is not defined in environment variables.');
    return;
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  interface S3UploadParams {
    Bucket: string;
    Key: string;
    Body: Buffer;
    ContentType: string;
  }

  interface S3UploadResponse {
    Location: string;
  }

  s3.upload(params as S3UploadParams, (err: Error, data: S3UploadResponse) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.status(200).send(`File uploaded successfully. ${data.Location}`);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});