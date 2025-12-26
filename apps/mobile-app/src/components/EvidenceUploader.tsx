
import React, { useState } from 'react';
import { Camera, X, CheckCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { MediaService } from '../lib/adapters/media';

interface EvidenceUploaderProps {
    onComplete: (images: string[]) => void;
    isSubmitting: boolean;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ onComplete, isSubmitting }) => {
    const [images, setImages] = useState<string[]>([]);

    const handleAddPhoto = async () => {
        if (images.length >= 3) return;
        try {
            const photo = await MediaService.getPhoto('CAMERA');
            setImages(prev => [...prev, photo.dataUrl]);
        } catch (e) {
            console.error("Capture cancelled");
        }
    };

    const removePhoto = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Evidencia de Trabajo</h4>
                <span className="text-[10px] font-bold text-slate-400">{images.length}/3 fotos</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-300">
                        <img src={img} className="w-full h-full object-cover" alt="Evidencia" />
                        <button 
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
                
                {images.length < 3 && (
                    <button 
                        onClick={handleAddPhoto}
                        disabled={isSubmitting}
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-green-500 hover:bg-green-50 transition-all"
                    >
                        <Camera size={24} />
                        <span className="text-[10px] font-bold mt-1">Sumar foto</span>
                    </button>
                )}
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
                * Cargá fotos claras del pasto cortado y el área limpia. La IA auditará el resultado.
            </p>

            <button 
                disabled={images.length === 0 || isSubmitting}
                onClick={() => onComplete(images)}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:bg-slate-300 active:scale-95 transition-transform"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        Procesando Auditoría...
                    </>
                ) : (
                    <>
                        <CheckCircle size={20} />
                        Finalizar Trabajo
                    </>
                )}
            </button>
        </div>
    );
};
