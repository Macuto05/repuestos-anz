import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadImage(
    fileBuffer: Buffer,
    folder: string = 'repuestos-anz/productos'
): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                {
                    folder,
                    resource_type: 'image',
                    transformation: [
                        { width: 800, height: 800, crop: 'limit', quality: 'auto', format: 'webp' },
                    ],
                },
                (error, result) => {
                    if (error || !result) {
                        reject(error || new Error('Upload failed'));
                    } else {
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                        });
                    }
                }
            )
            .end(fileBuffer);
    });
}

export async function uploadImageFromUrl(
    imageUrl: string,
    folder: string = 'repuestos-anz/productos'
): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            imageUrl,
            {
                folder,
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 800, crop: 'limit', quality: 'auto', format: 'webp' },
                ],
            },
            (error, result) => {
                if (error || !result) {
                    reject(error || new Error('Upload from URL failed'));
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            }
        );
    });
}

export async function deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
}
