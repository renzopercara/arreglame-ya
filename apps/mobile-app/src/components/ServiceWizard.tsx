import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock, 
  CircleDollarSign,
  AlertTriangle,
  Loader2
} from "lucide-react";
import CategoryGrid, { CATEGORIES } from "./CategoryGrid";
import ServiceForm, { ServiceSubcategory, ServiceMetadata } from "./ServiceForm";
import { useDebouncedPriceEstimator } from "../hooks/usePriceEstimator";

const STEPS = ["Categoría", "Servicio", "Detalles", "Resumen"];

const SUBCATEGORIES: Record<string, Array<{ id: ServiceSubcategory; label: string }>> = {
  MAINTENANCE: [
    { id: "LAWN_MOWING", label: "Corte de Pasto" },
    { id: "GARDEN_CLEANUP", label: "Limpieza de Jardín" },
    { id: "TREE_TRIMMING", label: "Poda de Árboles" },
    { id: "PRESSURE_WASHING", label: "Hidrolavado" },
  ],
  PAINTING: [
    { id: "INTERIOR_PAINTING", label: "Pintura Interior" },
    { id: "EXTERIOR_PAINTING", label: "Pintura Exterior" },
    { id: "WALL_REPAIR", label: "Reparación de Paredes" },
  ],
  HVAC: [
    { id: "AC_INSTALLATION", label: "Instalación de Aire" },
    { id: "AC_REPAIR", label: "Reparación de AC" },
    { id: "AC_MAINTENANCE", label: "Mantenimiento de AC" },
  ],
  ELECTRICAL: [
    { id: "OUTLET_INSTALLATION", label: "Tomacorrientes" },
    { id: "LIGHTING_INSTALLATION", label: "Iluminación" },
    { id: "CIRCUIT_BREAKER", label: "Tablero Eléctrico" },
  ],
  PLUMBING: [
    { id: "LEAK_REPAIR", label: "Reparación de Fugas" },
    { id: "PIPE_INSTALLATION", label: "Instalación de Cañerías" },
    { id: "DRAIN_CLEANING", label: "Destapación" },
  ],
};

export default function ServiceWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<ServiceSubcategory | null>(null);
  const [metadata, setMetadata] = useState<ServiceMetadata>({});
  
  const { estimate, loading, debouncedCalculate } = useDebouncedPriceEstimator();

  useEffect(() => {
    if (selectedSubcategory && Object.keys(metadata).length > 0) {
      debouncedCalculate({
        subcategory: selectedSubcategory,
        metadata,
        difficultyLevel: "MEDIUM", // Valor por defecto
      });
    }
  }, [metadata, selectedSubcategory, debouncedCalculate]);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const canProceed = () => {
    if (activeStep === 0) return selectedCategory !== null;
    if (activeStep === 1) return selectedSubcategory !== null;
    if (activeStep === 2) return Object.keys(metadata).length > 0 && estimate !== null;
    return true;
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800 px-1">¿Qué necesitas arreglar?</h2>
            <CategoryGrid 
              variant="full" 
              activeId={selectedCategory} 
              onSelect={(id) => {
                setSelectedCategory(id);
                setSelectedSubcategory(null);
                handleNext(); // Auto-advance para mejor UX
              }} 
            />
          </div>
        );

      case 1:
        const subs = selectedCategory ? SUBCATEGORIES[selectedCategory] : [];
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800 px-1">Selecciona el servicio</h2>
            <div className="grid grid-cols-1 gap-3">
              {subs.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSelectedSubcategory(sub.id);
                    handleNext();
                  }}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    selectedSubcategory === sub.id 
                      ? "border-blue-600 bg-blue-50" 
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <span className={`font-bold ${selectedSubcategory === sub.id ? 'text-blue-700' : 'text-slate-700'}`}>
                    {sub.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 px-1">Detalles técnicos</h2>
            <ServiceForm
              subcategory={selectedSubcategory!}
              value={metadata}
              onChange={setMetadata}
            />
            
            {/* Price Preview Floating Card */}
            {estimate && (
              <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-blue-100 font-medium">Precio Estimado</span>
                  <CircleDollarSign className="h-6 w-6 opacity-50" />
                </div>
                <div className="text-4xl font-black mb-4">
                  ${estimate.estimatedPrice.toLocaleString("es-AR")}
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-medium text-blue-100 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> {estimate.totalTime.toFixed(1)} hs
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" /> Final Garantizado
                  </div>
                </div>
              </div>
            )}
            {loading && <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 pb-20">
            <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center gap-3">
              <div className="bg-green-500 rounded-full p-1"><Check className="h-4 w-4 text-white" /></div>
              <span className="text-green-800 font-bold text-sm">¡Todo listo para contratar!</span>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
              <h3 className="font-black text-slate-800">Resumen del pedido</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Categoría</span>
                  <span className="font-bold text-slate-700">{selectedCategory}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Servicio</span>
                  <span className="font-bold text-slate-700">{selectedSubcategory}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tiempo de trabajo</span>
                  <span className="font-bold text-slate-700">{estimate?.totalTime} hs</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 text-center text-white">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total a pagar</span>
              <div className="text-5xl font-black mt-2 mb-4">${estimate?.estimatedPrice.toLocaleString("es-AR")}</div>
              <div className="flex items-center justify-center gap-2 text-amber-400 text-[10px]">
                <AlertTriangle className="h-3 w-3" />
                <span>El precio puede ajustarse según hallazgos técnicos en sitio</span>
              </div>
            </div>

            <button 
              className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all"
              onClick={() => alert("Iniciando flujo de pago...")}
            >
              Confirmar y Buscar Profesional
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4">
      {/* Header / Stepper Minimalista */}
      <div className="flex items-center justify-between mb-8 px-2 pt-4">
        <button 
          onClick={handleBack} 
          disabled={activeStep === 0}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 disabled:opacity-0"
        >
          <ChevronLeft className="h-6 w-6 text-slate-600" />
        </button>
        
        <div className="flex gap-2">
          {STEPS.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx <= activeStep ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto">
        {renderStepContent()}
      </div>

      {/* Footer Navigation (Solo se muestra si no es auto-advance) */}
      {activeStep > 0 && activeStep < 3 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto flex gap-3">
          {activeStep === 2 && (
             <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Ver Resumen <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}