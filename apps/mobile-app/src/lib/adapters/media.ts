import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

// --- TIPOS ---

export interface MediaPhoto {
  dataUrl: string; // Base64 completo con cabecera (data:image/jpeg...)
  format: string;
}

export type MediaSourceType = 'CAMERA' | 'PHOTOS';

export interface IMediaService {
  getPhoto(source: MediaSourceType): Promise<MediaPhoto>;
}

// --- ADAPTER WEB (Fallback HTML5) ---

class WebMediaAdapter implements IMediaService {
  async getPhoto(source: MediaSourceType): Promise<MediaPhoto> {
    return new Promise((resolve, reject) => {
      // 1. Crear input invisible en memoria
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      // Si es cÃƒÂ¡mara, forzamos environment (cÃƒÂ¡mara trasera)
      if (source === 'CAMERA') {
        input.setAttribute('capture', 'environment');
      }

      // 2. Escuchar cambios
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) {
          reject(new Error('SelecciÃƒÂ³n cancelada'));
          return;
        }

        try {
          const base64 = await this.fileToBase64(file);
          resolve({
            dataUrl: base64,
            format: file.type.split('/')[1]
          });
        } catch (err) {
          reject(new Error('Error procesando imagen'));
        }
      };

      // 3. Simular clic
      input.click();
    });
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}

// --- ADAPTER NATIVO (Capacitor) ---

class NativeMediaAdapter implements IMediaService {
  async getPhoto(source: MediaSourceType): Promise<MediaPhoto> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl, // Devuelve base64 directo
        source: source === 'CAMERA' ? CameraSource.Camera : CameraSource.Photos,
        // Opciones especÃƒÂ­ficas nativas
        saveToGallery: false, 
        correctOrientation: true
      });

      if (!image.dataUrl) {
        throw new Error('No se pudo obtener la imagen');
      }

      return {
        dataUrl: image.dataUrl,
        format: image.format
      };
    } catch (error: any) {
      // Manejo de cancelaciÃƒÂ³n del usuario en nativo
      if (error.message === 'User cancelled photos app') {
        throw new Error('SelecciÃƒÂ³n cancelada');
      }
      throw error;
    }
  }
}

// --- FACTORY ---

export const MediaService: IMediaService = Capacitor.isNativePlatform()
  ? new NativeMediaAdapter()
  : new WebMediaAdapter();
