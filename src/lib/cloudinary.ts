/**
 * Utility for uploading files directly to Cloudinary using Client-Side Unsigned Uploads.
 */

/**
 * Checks if Cloudinary credentials are fully configured.
 */
export function isCloudinaryConfigured(): boolean {
  const env = (import.meta as any).env;
  const cloudName = env?.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = env?.VITE_CLOUDINARY_UPLOAD_PRESET;
  return Boolean(cloudName && uploadPreset);
}

/**
 * Helper to get the Cloudinary configuration details.
 */
export function getCloudinaryConfig() {
  const env = (import.meta as any).env;
  return {
    cloudName: env?.VITE_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: env?.VITE_CLOUDINARY_UPLOAD_PRESET || ''
  };
}

/**
 * Uploads a file (File object, Blob, or Base64/Data URL string) to Cloudinary.
 * If Cloudinary is not configured or an error occurs, it falls back to Base64 (via FileReader)
 * so that the application remains fully functional, while displaying console logs.
 */
export async function uploadToCloudinary(fileOrData: File | string, onProgress?: (progress: number) => void): Promise<string> {
  const env = (import.meta as any).env;
  const cloudName = env?.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = env?.VITE_CLOUDINARY_UPLOAD_PRESET;

  // FALLBACK: If Cloudinary is not configured, we return/fallback to standard Base64 representation.
  if (!cloudName || !uploadPreset) {
    console.warn("Cloudinary is NOT configured. Falling back to local Base64 storage in Firestore.");
    if (typeof fileOrData === 'string') {
      return fileOrData;
    } else {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            resolve(e.target.result);
          } else {
            reject(new Error("Failed to read file for fallback Base64"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(fileOrData);
      });
    }
  }

  try {
    const formData = new FormData();
    formData.append('file', fileOrData);
    formData.append('upload_preset', uploadPreset);

    // Using XMLHttpRequest to support upload progress monitoring
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/upload`, true);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.secure_url) {
              resolve(response.secure_url);
            } else {
              reject(new Error("Cloudinary response missing secure_url"));
            }
          } catch (e) {
            reject(new Error("Failed to parse Cloudinary response JSON"));
          }
        } else {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during Cloudinary upload"));
      };

      xhr.send(formData);
    });
  } catch (error) {
    console.error("Cloudinary upload wrapper caught error:", error);
    // Graceful fallback to base64
    if (typeof fileOrData === 'string') {
      return fileOrData;
    } else {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(fileOrData);
      });
    }
  }
}
