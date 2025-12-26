
import React, { useState } from 'react';
import { CameraCapture } from '../components/CameraCapture';
import { ShieldCheck, FileText, User, ChevronRight, CheckCircle, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { SUBMIT_KYC } from '../graphql/queries';

interface KYCFlowViewProps {
    onComplete: () => void;
}

type Step = 'INTRO' | 'DNI_FRONT' | 'DNI_BACK' | 'INSURANCE' | 'SELFIE' | 'SUBMITTING';

export const KYCFlowView: React.FC<KYCFlowViewProps> = ({ onComplete }) => {
    const [step, setStep] = useState<Step>('INTRO');
    const [data, setData] = useState({
        dniFront: '',
        dniBack: '',
        insuranceDoc: '',
        selfie: ''
    });
    
    const [submitKYC, { loading }] = useMutation(SUBMIT_KYC);

    const handleSubmit = async () => {
        setStep('SUBMITTING');
        try {
            await submitKYC({ variables: { input: data } });
            onComplete();
        } catch (e) {
            alert("Error al subir documentación. Intente nuevamente.");
            setStep('INTRO');
        }
    };

    const handleCapture = (field: keyof typeof data, base64: string) => {
        setData(prev => ({ ...prev, [field]: base64 }));
    };

    const nextBtn = (nextStep: Step, disabled: boolean) => (
        <button 
            disabled={disabled}
            onClick={() => setStep(nextStep)}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
        >
            Continuar <ChevronRight size={20}/>
        </button>
    );

    if (step === 'INTRO') {
        return (
            <div className="flex flex-col h-full p-8 bg-white text-center">
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8">
                        <ShieldCheck className="text-green-600" size={48} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">Validación de Seguridad</h1>
                    <p className="text-slate-500 leading-relaxed mb-6">
                        Para recibir trabajos y cobrar, necesitamos validar tu identidad y seguro. Esto genera confianza en los clientes.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-2xl text-left w-full space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-700">
                            <CheckCircle size={16} className="text-green-500" /> DNI (Frente y Dorso)
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-700">
                            <CheckCircle size={16} className="text-green-500" /> Constancia de Seguro / Monotributo
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-700">
                            <CheckCircle size={16} className="text-green-500" /> Selfie de prueba de vida
                        </div>
                    </div>
                </div>
                <button onClick={() => setStep('DNI_FRONT')} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-xl">
                    Comenzar Validación
                </button>
            </div>
        );
    }

    if (step === 'SUBMITTING') {
        return (
            <div className="flex flex-col h-full bg-slate-900 items-center justify-center text-white">
                <Loader2 className="animate-spin mb-4" size={48} />
                <h2 className="text-xl font-bold">Encriptando datos...</h2>
                <p className="text-slate-400 text-sm mt-2">Estamos enviando tu información de forma segura.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                    {step === 'DNI_FRONT' && "Foto DNI (Frente)"}
                    {step === 'DNI_BACK' && "Foto DNI (Dorso)"}
                    {step === 'INSURANCE' && "Documento Fiscal / Seguro"}
                    {step === 'SELFIE' && "Selfie de Validación"}
                </h2>
                <p className="text-sm text-slate-500">
                    {step.includes('DNI') && "Asegurate que sea legible y sin reflejos."}
                    {step === 'INSURANCE' && "Constancia de AP o Monotributo al día."}
                    {step === 'SELFIE' && "Sonreí a la cámara."}
                </p>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                {step === 'DNI_FRONT' && (
                    <CameraCapture label="Frente del DNI" onCapture={(b64) => handleCapture('dniFront', b64)} initialImage={data.dniFront} />
                )}
                {step === 'DNI_BACK' && (
                    <CameraCapture label="Dorso del DNI" onCapture={(b64) => handleCapture('dniBack', b64)} initialImage={data.dniBack} />
                )}
                {step === 'INSURANCE' && (
                    <CameraCapture label="Foto del Documento" onCapture={(b64) => handleCapture('insuranceDoc', b64)} initialImage={data.insuranceDoc} />
                )}
                {step === 'SELFIE' && (
                    <CameraCapture label="Tu Selfie" onCapture={(b64) => handleCapture('selfie', b64)} initialImage={data.selfie} />
                )}
            </div>

            <div className="mt-6">
                {step === 'DNI_FRONT' && nextBtn('DNI_BACK', !data.dniFront)}
                {step === 'DNI_BACK' && nextBtn('INSURANCE', !data.dniBack)}
                {step === 'INSURANCE' && nextBtn('SELFIE', !data.insuranceDoc)}
                {step === 'SELFIE' && (
                    <button 
                        disabled={!data.selfie || loading}
                        onClick={handleSubmit}
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Lock size={18} /> Finalizar y Enviar
                    </button>
                )}
            </div>
        </div>
    );
};
