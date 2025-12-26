import React, { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search, MapPin, Loader2, X } from 'lucide-react';

declare var google: any;

interface Prediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressAutocompleteProps {
  onSelect: (placeId: string, description: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ 
  onSelect, 
  placeholder = "Buscar dirección...",
  initialValue = ""
}) => {
  const placesLib = useMapsLibrary('places');
  const [sessionToken, setSessionToken] = useState<any | null>(null);
  const [autocompleteService, setAutocompleteService] = useState<any | null>(null);
  
  const [inputValue, setInputValue] = useState(initialValue);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Inicializar Servicio y Token
  useEffect(() => {
    if (!placesLib) return;
    setAutocompleteService(new placesLib.AutocompleteService());
    setSessionToken(new placesLib.AutocompleteSessionToken());
  }, [placesLib]);

  // Manejar Input Change con Debounce manual simple
  useEffect(() => {
    if (!autocompleteService || !sessionToken || !inputValue) {
      setPredictions([]);
      return;
    }

    if (inputValue.length < 3) return;

    const timer = setTimeout(() => {
      setIsLoading(true);
      autocompleteService.getPlacePredictions(
        {
          input: inputValue,
          sessionToken: sessionToken,
          componentRestrictions: { country: 'ar' }, // Restringir a Argentina (Configurable)
          types: ['address', 'establishment'] // Direcciones y Negocios
        },
        (results: any, status: any) => {
          setIsLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results as any);
            setShowResults(true);
          } else {
            setPredictions([]);
          }
        }
      );
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [inputValue, autocompleteService, sessionToken]);

  const handleSelect = (pred: Prediction) => {
    setInputValue(pred.structured_formatting.main_text);
    setShowResults(false);
    
    // CRÍTICO: Regenerar el token después de una selección para cerrar la sesión de facturación anterior
    // y comenzar una nueva para la próxima búsqueda.
    if (placesLib) {
        setSessionToken(new placesLib.AutocompleteSessionToken());
    }

    onSelect(pred.place_id, pred.description);
  };

  const handleClear = () => {
      setInputValue('');
      setPredictions([]);
      setShowResults(false);
  };

  return (
    <div className="relative w-full z-[1001]">
      <div className="flex items-center bg-white rounded-xl shadow-lg border border-slate-100 p-3 transition-shadow focus-within:shadow-xl focus-within:ring-2 focus-within:ring-green-500/20">
        {isLoading ? (
            <Loader2 className="animate-spin text-green-600 mr-3" size={20} />
        ) : (
            <Search className="text-slate-400 mr-3" size={20} />
        )}
        
        <input
          type="text"
          className="flex-1 outline-none text-slate-800 font-medium placeholder:text-slate-400 bg-transparent text-sm sm:text-base"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => { if(predictions.length > 0) setShowResults(true); }}
        />

        {inputValue && (
            <button onClick={handleClear} className="p-1 text-slate-300 hover:text-slate-500">
                <X size={18} />
            </button>
        )}
      </div>

      {showResults && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <ul className="divide-y divide-slate-50">
            {predictions.map((pred) => (
              <li 
                key={pred.place_id} 
                className="hover:bg-green-50 cursor-pointer p-4 flex items-start gap-3 transition-colors"
                onClick={() => handleSelect(pred)}
              >
                <div className="mt-1 bg-slate-100 p-1.5 rounded-full text-slate-500">
                    <MapPin size={14} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{pred.structured_formatting.main_text}</p>
                  <p className="text-xs text-slate-500 truncate">{pred.structured_formatting.secondary_text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="bg-slate-50 p-2 flex justify-end">
              <img src="https://developers.google.com/maps/documentation/images/powered_by_google_on_white.png" alt="Powered by Google" className="h-4 opacity-70" />
          </div>
        </div>
      )}
    </div>
  );
};