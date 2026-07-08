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

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  const getBase64Fallback = (): Promise<string> => {
    if (typeof fileOrData === 'string') {
      return Promise.resolve(fileOrData);
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
  };

  // Immediate fallback when offline
  if (isOffline) {
    console.log("[PWA Offline] Connection unavailable. Falling back instantly to local Base64 media storage.");
    return getBase64Fallback();
  }

  // FALLBACK: If Cloudinary is not configured, we return/fallback to standard Base64 representation.
  if (!cloudName || !uploadPreset) {
    console.warn("Cloudinary is NOT configured. Falling back to local Base64 storage in Firestore.");
    return getBase64Fallback();
  }

  try {
    const formData = new FormData();
    formData.append('file', fileOrData);
    formData.append('upload_preset', uploadPreset);

    // Using XMLHttpRequest to support upload progress monitoring
    const uploadPromise = new Promise<string>((resolve, reject) => {
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

    return await uploadPromise;
  } catch (error) {
    console.warn("Cloudinary upload failed, falling back to Base64:", error);
    return getBase64Fallback();
  }
}

/**
 * Dynamically optimizes an image URL (Cloudinary or Unsplash or any other URL)
 * using transformations: auto-format, auto-quality, and custom resizing.
 */
export function optimizeImageUrl(
  url: string | undefined | null, 
  options: { width?: number; height?: number; crop?: 'fill' | 'scale' | 'limit' | 'crop' } = {}
): string {
  if (!url) return '';

  // 1. If it's a Cloudinary URL, inject optimal quality, format, and optional sizing
  if (url.includes('res.cloudinary.com')) {
    const urlParts = url.split('/upload/');
    if (urlParts.length === 2) {
      const { width, height, crop = 'limit' } = options;
      let transformString = 'f_auto,q_auto';
      if (width) transformString += `,w_${width}`;
      if (height) transformString += `,h_${height}`;
      if (width || height) transformString += `,c_${crop}`;
      return `${urlParts[0]}/upload/${transformString}/${urlParts[1]}`;
    }
  }

  // 2. If it's an Unsplash URL, replace/inject query parameters
  if (url.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      params.set('auto', 'format');
      params.set('q', '75'); // high visual fidelity, lower size
      if (options.width) {
        params.set('w', options.width.toString());
      }
      if (options.height) {
        params.set('h', options.height.toString());
      }
      if (options.crop) {
        params.set('fit', options.crop === 'fill' ? 'crop' : 'max');
      } else {
        params.set('fit', 'crop');
      }
      return urlObj.toString();
    } catch (e) {
      return url; // fallback to raw string if parsing fails
    }
  }

  // 3. Fallback for other URLs
  return url;
}

