"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Loader2,
  AlertTriangle,
  CircleDollarSign,
} from "lucide-react";
import { useLocationContext } from "@/contexts/LocationContext";
import { useAuth } from "@/app/providers";
import { getLucideIcon } from "@/lib/icons";
import { GET_SERVICE_CATEGORIES, PREVIEW_SERVICE_PRICE, CREATE_SERVICE_REQUEST } from "@/graphql/queries";
import { ServiceCategory } from "@/types/category";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

interface WizardState {
  serviceCategoryId: string | null;
  squareMeters: number;
  difficultyLevel: DifficultyLevel;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

interface PricingPreview {
  baseAmount: number;
  variableAmount: number;
  finalAmount: number;
  pricingVersion: string;
  currency: string;
  adjustments: Array<{ label: string; amount: number }>;
}

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const STEPS = ["Categoría", "Detalles", "Ubicación", "Precio", "Confirmar"];

const DEFAULT_TENANT_ID = "default";

const DIFFICULTY_OPTIONS: Array<{ value: DifficultyLevel; label: string; desc: string }> = [
  { value: "EASY", label: "Fácil", desc: "Acceso libre, sin obstáculos" },
  { value: "MEDIUM", label: "Moderado", desc: "Algunos obstáculos o complejidad media" },
  { value: "HARD", label: "Difícil", desc: "Alto nivel de dificultad o riesgo" },
];

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const formatCurrency = (amount: number, currency = "ARS"): string =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

/* -------------------------------------------------------------------------- */
/* STEP COMPONENTS                                                            */
/* -------------------------------------------------------------------------- */

function StepCategory({
  state,
  onSelect,
}: {
  state: WizardState;
  onSelect: (id: string) => void;
}) {
  const { data, loading, error } = useQuery(GET_SERVICE_CATEGORIES, {
    fetchPolicy: "cache-and-network",
  });

  const categories: ServiceCategory[] = data?.serviceCategories ?? [];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-center">
        <p className="text-sm font-semibold text-red-600">
          No se pudieron cargar las categorías
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-800">¿Qué necesitas?</h2>
      <div className="grid grid-cols-1 gap-3">
        {categories.map((cat) => {
          const Icon = getLucideIcon(cat.iconName);
          const isActive = state.serviceCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={`flex items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-white text-slate-700 border border-slate-100 shadow-sm hover:border-blue-200"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${
                  isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <span className="block text-base font-bold">{cat.name}</span>
                {cat.description && (
                  <p
                    className={`mt-0.5 text-xs line-clamp-1 ${
                      isActive ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    {cat.description}
                  </p>
                )}
              </div>
              <ChevronRight
                className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-300"}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDetails({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-800">Detalles del trabajo</h2>

      {/* Square Meters */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">
          Metros cuadrados aproximados
        </label>
        <input
          type="number"
          min={1}
          placeholder="Ej: 50"
          value={state.squareMeters || ""}
          onChange={(e) => onChange({ squareMeters: parseFloat(e.target.value) || 0 })}
          className="w-full px-4 py-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
        />
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">Nivel de dificultad</label>
        <div className="grid grid-cols-1 gap-2">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ difficultyLevel: opt.value })}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                state.difficultyLevel === opt.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-100 bg-white"
              }`}
            >
              <span
                className={`block text-sm font-bold ${
                  state.difficultyLevel === opt.value ? "text-blue-700" : "text-slate-700"
                }`}
              >
                {opt.label}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description (optional) */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">
          Descripción{" "}
          <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Describe brevemente el trabajo..."
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm resize-none"
        />
      </div>
    </div>
  );
}

function StepLocation({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
}) {
  const { latitude: ctxLat, longitude: ctxLng, cityName, status } = useLocationContext();
  const [locationError, setLocationError] = useState<string | null>(null);

  const useCurrentLocation = useCallback(() => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Tu dispositivo no soporta geolocalización");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        setLocationError(
          "No se pudo obtener tu ubicación. Verifica los permisos de localización."
        );
      }
    );
  }, [onChange]);

  // Auto-fill from context on mount if available
  useEffect(() => {
    if (state.latitude === null && state.longitude === null && ctxLat && ctxLng) {
      onChange({ latitude: ctxLat, longitude: ctxLng });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxLat, ctxLng]);

  const hasCoords = state.latitude !== null && state.longitude !== null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-800">Ubicación del servicio</h2>

      {hasCoords ? (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="bg-green-500 rounded-full p-1 mt-0.5">
            <Check className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-green-800">Ubicación confirmada</p>
            <p className="text-xs text-green-700 mt-0.5">
              {cityName || `${state.latitude!.toFixed(4)}, ${state.longitude!.toFixed(4)}`}
            </p>
            <button
              onClick={useCurrentLocation}
              className="text-xs text-green-600 underline mt-1"
            >
              Actualizar ubicación
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-full h-40 bg-slate-100 rounded-3xl flex items-center justify-center">
            <MapPin className="h-8 w-8 text-slate-300" />
          </div>
          <button
            onClick={useCurrentLocation}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all"
          >
            <MapPin className="h-5 w-5" />
            Usar mi ubicación actual
          </button>
        </div>
      )}

      {locationError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700">{locationError}</p>
        </div>
      )}
    </div>
  );
}

function StepPricePreview({
  state,
  preview,
  loading,
  error,
}: {
  state: WizardState;
  preview: PricingPreview | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-800">Vista previa de precio</h2>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500 font-medium">Calculando precio...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Error al calcular precio</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {preview && !loading && (
        <>
          <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-blue-100 font-medium text-sm">Precio estimado</span>
              <CircleDollarSign className="h-6 w-6 opacity-50" />
            </div>
            <div className="text-5xl font-black mb-2">
              {formatCurrency(preview.finalAmount, preview.currency)}
            </div>
            <p className="text-blue-200 text-xs">Precio final calculado por el servidor</p>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Desglose</h3>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Precio base</span>
              <span className="font-bold text-slate-700">
                {formatCurrency(preview.baseAmount, preview.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Variable</span>
              <span className="font-bold text-slate-700">
                {formatCurrency(preview.variableAmount, preview.currency)}
              </span>
            </div>
            {preview.adjustments.map((adj, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-500">{adj.label}</span>
                <span className="font-bold text-slate-700">
                  {formatCurrency(adj.amount, preview.currency)}
                </span>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-3 flex justify-between text-sm">
              <span className="font-black text-slate-800">Total</span>
              <span className="font-black text-blue-600">
                {formatCurrency(preview.finalAmount, preview.currency)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 rounded-xl p-3">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>El precio puede ajustarse según hallazgos en sitio</span>
          </div>
        </>
      )}
    </div>
  );
}

function StepConfirmation({
  state,
  preview,
  submitting,
  onConfirm,
}: {
  state: WizardState;
  preview: PricingPreview | null;
  submitting: boolean;
  onConfirm: () => void;
}) {
  const { data } = useQuery(GET_SERVICE_CATEGORIES, { fetchPolicy: "cache-only" });
  const categories: ServiceCategory[] = data?.serviceCategories ?? [];
  const selectedCategory = categories.find((c) => c.id === state.serviceCategoryId);

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-xl font-black text-slate-800">Confirmar solicitud</h2>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
        <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">
          Resumen
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Categoría</span>
            <span className="font-bold text-slate-700">{selectedCategory?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Metros cuadrados</span>
            <span className="font-bold text-slate-700">{state.squareMeters} m²</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Dificultad</span>
            <span className="font-bold text-slate-700">
              {DIFFICULTY_OPTIONS.find((d) => d.value === state.difficultyLevel)?.label}
            </span>
          </div>
          {state.description && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Descripción</span>
              <span className="font-bold text-slate-700 text-right max-w-[60%] line-clamp-2">
                {state.description}
              </span>
            </div>
          )}
        </div>
      </div>

      {preview && (
        <div className="bg-slate-900 rounded-3xl p-8 text-center text-white">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            Total a pagar
          </span>
          <div className="text-5xl font-black mt-2 mb-4">
            {formatCurrency(preview.finalAmount, preview.currency)}
          </div>
          <p className="text-slate-400 text-xs">Precio calculado por el servidor · No modificable</p>
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={submitting || !preview}
        className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Procesando...
          </>
        ) : (
          "Confirmar y Buscar Profesional"
        )}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN WIZARD COMPONENT                                                      */
/* -------------------------------------------------------------------------- */

export default function CreateServiceRequestWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const { latitude: ctxLat, longitude: ctxLng } = useLocationContext();

  const [activeStep, setActiveStep] = useState(0);
  const [wizardState, setWizardState] = useState<WizardState>({
    serviceCategoryId: null,
    squareMeters: 0,
    difficultyLevel: "MEDIUM",
    description: "",
    latitude: ctxLat ?? null,
    longitude: ctxLng ?? null,
  });
  const [preview, setPreview] = useState<PricingPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Debounce timer for price preview
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [createServiceRequest] = useMutation(CREATE_SERVICE_REQUEST);
  const previewQuery = useQuery(PREVIEW_SERVICE_PRICE, { skip: true });

  const updateState = useCallback((partial: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...partial }));
  }, []);

  // Fetch price preview with debounce when entering step 3 (price)
  const fetchPricePreview = useCallback(
    async (state: WizardState) => {
      if (
        !state.serviceCategoryId ||
        !state.squareMeters ||
        state.squareMeters <= 0 ||
        state.latitude === null ||
        state.longitude === null
      ) {
        return;
      }

      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const { data } = await previewQuery.refetch({
          input: {
            tenantId: DEFAULT_TENANT_ID,
            serviceCategoryId: state.serviceCategoryId,
            squareMeters: state.squareMeters,
            difficultyLevel: state.difficultyLevel,
            latitude: state.latitude,
            longitude: state.longitude,
          },
        });

        if (data?.previewServicePrice) {
          setPreview(data.previewServicePrice as PricingPreview);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al calcular precio";
        setPreviewError(message);
      } finally {
        setPreviewLoading(false);
      }
    },
    [previewQuery]
  );

  // Trigger price preview with debounce when entering step 3
  useEffect(() => {
    if (activeStep === 3) {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      previewTimerRef.current = setTimeout(() => {
        fetchPricePreview(wizardState);
      }, 500);
    }
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [activeStep, wizardState.serviceCategoryId, wizardState.squareMeters, wizardState.difficultyLevel, wizardState.latitude, wizardState.longitude, fetchPricePreview]);

  const canProceed = (): boolean => {
    switch (activeStep) {
      case 0:
        return wizardState.serviceCategoryId !== null;
      case 1:
        return wizardState.squareMeters > 0;
      case 2:
        return wizardState.latitude !== null && wizardState.longitude !== null;
      case 3:
        return preview !== null && !previewLoading;
      case 4:
        return preview !== null && !submitting;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed()) setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    if (activeStep === 0) {
      router.back();
    } else {
      setActiveStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleConfirm = async () => {
    if (!wizardState.serviceCategoryId || !wizardState.latitude || !wizardState.longitude) return;

    setSubmitting(true);
    try {
      const { data } = await createServiceRequest({
        variables: {
          input: {
            tenantId: DEFAULT_TENANT_ID,
            serviceCategoryId: wizardState.serviceCategoryId,
            squareMeters: wizardState.squareMeters,
            difficultyLevel: wizardState.difficultyLevel,
            latitude: wizardState.latitude,
            longitude: wizardState.longitude,
            description: wizardState.description || undefined,
          },
        },
      });

      if (data?.createServiceRequest?.id) {
        router.push(`/services/request-success?id=${data.createServiceRequest.id}`);
      }
    } catch (err: unknown) {
      console.error("Error creating service request:", err);
      setPreviewError(
        err instanceof Error ? err.message : "Error al crear la solicitud"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- render step content ---------- */
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <StepCategory
            state={wizardState}
            onSelect={(id) => {
              updateState({ serviceCategoryId: id });
              setActiveStep(1);
            }}
          />
        );
      case 1:
        return <StepDetails state={wizardState} onChange={updateState} />;
      case 2:
        return <StepLocation state={wizardState} onChange={updateState} />;
      case 3:
        return (
          <StepPricePreview
            state={wizardState}
            preview={preview}
            loading={previewLoading}
            error={previewError}
          />
        );
      case 4:
        return (
          <StepConfirmation
            state={wizardState}
            preview={preview}
            submitting={submitting}
            onConfirm={handleConfirm}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4">
      {/* Header / Stepper */}
      <div className="flex items-center justify-between mb-8 px-2 pt-4">
        <button
          onClick={handleBack}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100"
          aria-label="Volver"
        >
          <ChevronLeft className="h-6 w-6 text-slate-600" />
        </button>

        <div className="flex gap-2">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx <= activeStep ? "w-8 bg-blue-600" : "w-2 bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto">{renderStep()}</div>

      {/* Footer Navigation (shown on steps 1-3, not on step 0 which is auto-advance, nor step 4 which has inline button) */}
      {activeStep > 0 && activeStep < 4 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            Continuar <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
