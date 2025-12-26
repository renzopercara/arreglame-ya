
import { useState, useCallback } from 'react';
import { MediaService, MediaSourceType } from '../lib/adapters/media';

interface UseCameraResult {
  photo: string | null; // DataURL
  isProcessing: boolean;
  error: string | null;
  takePhoto: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  clearPhoto: () => void;
}

export const useCamera = (): UseCameraResult => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processMedia = useCallback(async (source: MediaSourceType) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await MediaService.getPhoto(source);
      setPhoto(result.dataUrl);
    } catch (err: any) {
      if (err.message !== 'SelecciÃƒÂ³n cancelada') {
        console.error('Camera Error:', err);
        setError('No pudimos cargar la imagen. IntentÃƒÂ¡ de nuevo.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const takePhoto = () => processMedia('CAMERA');
  const pickFromGallery = () => processMedia('PHOTOS');
  const clearPhoto = () => {
    setPhoto(null);
    setError(null);
  };

  return { photo, isProcessing, error, takePhoto, pickFromGallery, clearPhoto };
};
