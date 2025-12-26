
import React from 'react';
import { useCamera } from '../hooks/useCamera';
import { Camera, Image as ImageIcon, X, Loader2, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  label?: string;
  initialImage?: string | null;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ 
  onCapture, 
  label = "Foto del trabajo",
  initialImage 
}) => {
  const { photo, isProcessing, error, takePhoto, pickFromGallery, clearPhoto } = useCamera();

  // Prioridad: Foto nueva > Foto inicial
  const currentImage = photo || initialImage;

  // Propagar cambio al padre cuando hay nueva foto
  React.useEffect(() => {
    if (photo) onCapture(photo);
  }, [photo, onCapture]);

  if (currentImage) {
    return (
      <div className="relative w-full aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
        <img 
          src={currentImage} 
          alt="Preview" 
          className="w-full h-full object-cover" 
        />
        
        {/* Overlay de acciones */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <button 
            onClick={takePhoto}
            className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30"
            title="Retomar foto"
          >
            <RefreshCw size={24} />
          </button>
          <button 
            onClick={clearPhoto}
            className="p-3 bg-red-500/80 backdrop-blur-md text-white rounded-full hover:bg-red-600/80"
            title="Eliminar"
          >
            <X size={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-6 flex flex-col items-center justify-center gap-4 transition-colors hover:border-green-400 hover:bg-green-50/30">
        
        {isProcessing ? (
          <div className="py-8 flex flex-col items-center text-slate-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <span className="text-xs">Procesando imagen...</span>
          </div>
        ) : (
          <>
            <div className="p-4 bg-white rounded-full shadow-sm text-green-600">
              <Camera size={32} />
            </div>
            
            <div className="text-center">
              <h3 className="font-bold text-slate-700">{label}</h3>
              <p className="text-xs text-slate-400 mt-1">Sube una foto clara</p>
            </div>

            <div className="flex gap-3 w-full max-w-xs">
              <button 
                onClick={takePhoto}
                className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Camera size={16} /> Cámara
              </button>
              <button 
                onClick={pickFromGallery}
                className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-transform"
              >
                <ImageIcon size={16} /> Galería
              </button>
            </div>
          </>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-2 text-center font-medium">{error}</p>
      )}
    </div>
  );
};
