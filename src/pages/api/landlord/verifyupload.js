// import multer from 'multer';
// import fs from 'fs';
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { createConnection } from 'mysql2';
// import {runMiddleware} from "../../lib/middleware";
//
// // Configure Multer for file uploads
// const upload = multer({ dest: './public/uploads' });
//
// export const config = {
//     api: {
//         bodyParser: false, // Disable built-in body parser
//     },
// };
//
// // Configure S3 client
// const s3Client = new S3Client({
//     region: process.env.AWS_REGION, // Your AWS region
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID, // AWS Access Key ID
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // AWS Secret Access Key
//     },
// });
//
// export default async function handler(req, res) {
//     if (req.method === 'POST') {
//         try {
//             // Run Multer middleware
//             await runMiddleware(req, res, upload.single('uploadedFile'));
//
//             const { selfie, user_id  } = req.body;
//
//             // Upload the file to S3
//             const uploadedFileStream = fs.createReadStream(req.file.path);
//             const s3FileKey = `uploadDocs/${Date.now()}-${req.file.originalname}`;
//             const fileParams = {
//                 Bucket: process.env.S3_BUCKET_NAME, // S3 Bucket name
//                 Key: s3FileKey,
//                 Body: uploadedFileStream,
//                 ContentType: req.file.mimetype,
//             };
//
//             const fileCommand = new PutObjectCommand(fileParams);
//             await s3Client.send(fileCommand);
//
//             // Get the S3 URL for the uploaded file
//             const s3FileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3FileKey}`;
//
//             let s3SelfieUrl = null;
//
//             // If a selfie is provided, upload it to S3
//             if (selfie) {
//                 const base64Data = selfie.replace(/^data:image\/jpeg;base64,/, '');
//                 const selfieFileName = `selfies/${Date.now()}.jpg`;
//                 const selfieBuffer = Buffer.from(base64Data, 'base64');
//                 const selfieParams = {
//                     Bucket: process.env.S3_BUCKET_NAME,
//                     Key: selfieFileName,
//                     Body: selfieBuffer,
//                     ContentType: 'image/jpeg',
//                 };
//
//                 const selfieCommand = new PutObjectCommand(selfieParams);
//                 await s3Client.send(selfieCommand);
//
//                 // Get the S3 URL for the uploaded selfie
//                 s3SelfieUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${selfieFileName}`;
//             }
//
//             // Save file paths to MySQL
//             const connection = await createConnection({
//                 host: process.env.DB_HOST,
//                 user: process.env.DB_USER,
//                 password: process.env.DB_PASSWORD,
//                 database: process.env.DB_NAME,
//             });
//
//             const query = `
//         INSERT INTO uploads (user_id,file_path, selfie_path)
//         VALUES (?,?, ?)
//       `;
//             await connection.execute(query, [user_id,s3FileUrl, s3SelfieUrl]);
//             await connection.end();
//
//             // Remove the local file to clean up
//             fs.unlinkSync(req.file.path);
//
//             res.status(200).json({
//                 message: 'Upload successful',
//                 fileUrl: s3FileUrl,
//                 selfieUrl: s3SelfieUrl,
//             });
//         } catch (error) {
//             console.error('Error in upload handler:', error);
//             res.status(500).json({ error: 'Internal Server Error' });
//         }
//     } else {
//         res.status(405).json({ error: 'Method not allowed' });
//     }
// }


import multer from 'multer';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import mysql from 'mysql2/promise';
import { runMiddleware } from "../../lib/middleware";

// Configure Multer for file uploads
const upload = multer({ dest: './public/uploads' });

export const config = {
    api: {
        bodyParser: false, // Disable built-in body parser
    },
};

// Configure AWS S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Run Multer middleware
        await runMiddleware(req, res, upload.single('uploadedFile'));

        const { selfie, landlord_id, documentType } = req.body;

        if (!landlord_id || !documentType) {
            return res.status(400).json({ error: "Missing required fields: landlord_id or documentType" });
        }

        // Upload the document to S3
        const uploadedFileStream = fs.createReadStream(req.file.path);
        const s3FileKey = `landlordDocs/${Date.now()}-${req.file.originalname}`;
        const fileParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3FileKey,
            Body: uploadedFileStream,
            ContentType: req.file.mimetype,
        };

        const fileCommand = new PutObjectCommand(fileParams);
        await s3Client.send(fileCommand);

        // Get S3 URL for the uploaded document
        const s3FileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3FileKey}`;

        let s3SelfieUrl = null;

        // If a selfie is provided, upload it to S3
        if (selfie) {
            const base64Data = selfie.replace(/^data:image\/jpeg;base64,/, '');
            const selfieFileName = `landlordSelfies/${Date.now()}.jpg`;
            const selfieBuffer = Buffer.from(base64Data, 'base64');
            const selfieParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: selfieFileName,
                Body: selfieBuffer,
                ContentType: 'image/jpeg',
            };

            const selfieCommand = new PutObjectCommand(selfieParams);
            await s3Client.send(selfieCommand);

            // Get the S3 URL for the uploaded selfie
            s3SelfieUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${selfieFileName}`;
        }

        // Connect to MySQL
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // Insert into `landlord_verification` table
        const query = `
            INSERT INTO landlord_verification (landlord_id, document_type, document_url, selfie_url, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())
        `;
        await connection.execute(query, [landlord_id, documentType, s3FileUrl, s3SelfieUrl]);
        await connection.end();

        // Remove the local file to clean up
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            message: 'Upload successful',
            fileUrl: s3FileUrl,
            selfieUrl: s3SelfieUrl,
        });

    } catch (error) {
        console.error('Error in upload handler:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
