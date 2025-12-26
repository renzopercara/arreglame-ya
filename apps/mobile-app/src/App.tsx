import React, { useState, useEffect } from 'react';
import { UserRole, AppState, JobStatus, UserStatus, WorkerStatus, ServiceRequest, AppNotification, GPSStatus, WorkerTier, KYCStatus } from './types';
import { ClientView } from './views/ClientView';
import { WorkerView } from './views/WorkerView';
import { AuthView } from './views/AuthView';
import { WalletView } from './views/WalletView'; 
import { EarningsView } from './views/EarningsView'; 
import { ActivityHistoryView } from './views/ActivityHistoryView';
import { KYCFlowView } from './views/KYCFlowView';
import { PushController } from './components/PushController'; 
import { AppStateController } from './components/AppStateController'; 
import { PermissionFlow } from './components/PermissionFlow';
import { TermsModal } from './components/TermsModal';
import { useWorkerLocationSync } from './hooks/useWorkerLocationSync';
import { LogOut, Ban, Wallet, DollarSign, Clock } from 'lucide-react';
import { GeoService } from './lib/adapters/geo';
import { NotificationAdapter } from './lib/adapters/notifications';
import { StorageAdapter } from './lib/adapters/storage';

import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { ME_QUERY, ACCEPT_LATEST_TERMS, GET_LATEST_TERMS } from './graphql/queries';
import { useAppState } from './hooks/useAppState';
import { SplashScreen } from '../../../components/SplashScreen';
import { fetchAppConfig } from '../../../services/mockBackend';
import { getCurrentPosition } from '../../../services/locationService';
import { NotificationSystem } from '../../../components/NotificationSystem';

const INITIAL_STATE: AppState = {
  currentUserRole: UserRole.CLIENT,
  currentClient: { id: '', name: '', rating: 5.0, loyaltyPoints: 0, status: UserStatus.ANON },
  currentWorker: { id: '', name: '', rating: 0, totalJobs: 0, status: WorkerStatus.OFFLINE, kycStatus: KYCStatus.NOT_SUBMITTED, balance: 0, location: { lat: -34.605, lng: -58.385 }, reputationPoints: 0, currentPlan: WorkerTier.STARTER },
  requests: [],
  notifications: [],
  gpsStatus: GPSStatus.UNKNOWN,
  showForcedTerms: false
};

function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [showPermissions, setShowPermissions] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentView, setCurrentView] = useState<'HOME' | 'WALLET' | 'HISTORY'>('HOME');
  const [historyJobId, setHistoryJobId] = useState<string | null>(null);

  const apolloClient = useApolloClient();
  const { isActive: isAppActive } = useAppState();

  const { data: userData, loading: userLoading, refetch: refetchUser, error: userError } = useQuery<any>(ME_QUERY, {
    notifyOnNetworkStatusChange: true,
  });

  const { data: termsData } = useQuery<any>(GET_LATEST_TERMS, {
      variables: { role: state.currentUserRole },
      skip: !state.showForcedTerms
  });

  const [acceptTermsMutation] = useMutation(ACCEPT_LATEST_TERMS);

  useEffect(() => {
    if (userError) {
       StorageAdapter.remove('ay_auth_token');
       setIsAuthChecking(false);
    }
  }, [userError]);

  useEffect(() => {
    bootstrapApp();
  }, [userData, userError]);

  const bootstrapApp = async () => {
    if (userLoading) return;

    try {
        await fetchAppConfig();
        const gpsStatus = await GeoService.checkPermissions();
        const pushStatus = await NotificationAdapter.checkPermission();
        const needsPermissions = gpsStatus !== 'granted' || pushStatus === 'prompt';

        let location = null;
        let currentGpsStatus = GPSStatus.UNKNOWN;

        if (gpsStatus === 'granted') {
            try {
                location = await getCurrentPosition();
                currentGpsStatus = GPSStatus.GRANTED;
            } catch (e) {
                currentGpsStatus = GPSStatus.DENIED;
            }
        } else {
             currentGpsStatus = GPSStatus.DENIED;
        }

        if (userData?.me) {
            const user = userData.me;
            const isClient = user.role === UserRole.CLIENT;
            const mustAcceptTerms = user.mustAcceptTerms === true;

            setState(prev => ({
                ...prev,
                currentUserRole: user.role,
                gpsStatus: currentGpsStatus,
                showForcedTerms: mustAcceptTerms,
                currentClient: isClient ? { 
                    ...prev.currentClient, 
                    id: user.id,
                    name: user.name,
                    status: user.status,
                    loyaltyPoints: user.loyaltyPoints || 0,
                    mustAcceptTerms
                } : prev.currentClient,
                currentWorker: !isClient ? { 
                    ...prev.currentWorker, 
                    id: user.id,
                    name: user.name,
                    status: user.workerStatus || WorkerStatus.OFFLINE,
                    kycStatus: user.kycStatus || KYCStatus.NOT_SUBMITTED,
                    balance: user.balance || 0,
                    location: location || prev.currentWorker.location,
                    currentPlan: user.currentPlan || WorkerTier.STARTER,
                    mustAcceptTerms
                } : prev.currentWorker
            }));
            
            if (needsPermissions && !mustAcceptTerms) setShowPermissions(true);
        } else {
            setState(prev => ({ ...prev, gpsStatus: currentGpsStatus }));
        }

    } catch (error) {
        console.error("Bootstrap Error:", error);
    } finally {
        setIsAuthChecking(false);
    }
  };

  const handlePermissionsComplete = async () => {
      setShowPermissions(false);
      try {
          const loc = await getCurrentPosition();
          setState(prev => ({
              ...prev,
              gpsStatus: GPSStatus.GRANTED,
              currentWorker: { ...prev.currentWorker, location: loc }
          }));
      } catch (e) {
          setState(prev => ({ ...prev, gpsStatus: GPSStatus.MANUAL }));
      }
  };

  const handleLoginSuccess = async () => {
      await apolloClient.resetStore(); 
      await refetchUser(); 
  };

  const handleLogout = async () => {
      await StorageAdapter.remove('ay_auth_token');
      await apolloClient.clearStore();
      setState(INITIAL_STATE);
      setCurrentView('HOME');
      window.location.reload(); 
  };

  const handleForcedTermsAccept = async () => {
      const docId = termsData?.latestTerms?.id;
      if (!docId) return;
      const userId = state.currentUserRole === UserRole.CLIENT ? state.currentClient.id : state.currentWorker.id;
      try {
          await acceptTermsMutation({ variables: { userId, documentId: docId } });
          setState(prev => ({ ...prev, showForcedTerms: false }));
          await refetchUser();
      } catch (e) { alert("Error al guardar aceptación."); }
  };

  const handleExternalPush = (notif: AppNotification) => {
      setState(prev => ({ ...prev, notifications: [...prev.notifications, notif] }));
  };

  const dismissNotification = (id: string) => {
      setState(prev => ({
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== id)
      }));
  };

  const handleAppResume = () => {
      refetchUser();
  };

  const handleGpsRestored = (lat: number, lng: number) => {
      setState(prev => ({
          ...prev,
          currentWorker: {
              ...prev.currentWorker,
              location: { lat, lng }
          }
      }));
  };

  useWorkerLocationSync(state.currentUserRole, state.currentWorker.status, isAppActive);

  // RENDER LOGIC

  if (isAuthChecking || userLoading) return <SplashScreen />;
  
  if (state.currentClient.status === UserStatus.BLOCKED) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
              <div className="text-center p-8 bg-white/10 rounded-3xl backdrop-blur">
                  <Ban size={48} className="mx-auto text-red-500 mb-4" />
                  <h1 className="text-2xl font-bold mb-2">Cuenta Bloqueada</h1>
                  <button onClick={handleLogout} className="px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 text-sm">Cerrar Sesión</button>
              </div>
          </div>
      );
  }

  if (!userData?.me) {
      return (
          <div className="flex justify-center items-center min-h-screen bg-slate-900 font-sans">
            <div className="w-full max-w-md h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                <AuthView onLoginSuccess={handleLoginSuccess} />
            </div>
          </div>
      );
  }

  if (state.showForcedTerms) return <TermsModal role={state.currentUserRole} onAccept={handleForcedTermsAccept} onCancel={() => { if (confirm("¿Cerrar sesión?")) handleLogout(); }} />;

  // KYC BLOCKING LOGIC (WORKER ONLY)
  if (state.currentUserRole === UserRole.WORKER) {
      if (state.currentWorker.kycStatus === KYCStatus.NOT_SUBMITTED) {
          return (
              <div className="flex justify-center items-center min-h-screen bg-slate-900 font-sans">
                  <div className="w-full max-w-md h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                      <KYCFlowView onComplete={() => refetchUser()} />
                  </div>
              </div>
          );
      }
      if (state.currentWorker.kycStatus === KYCStatus.PENDING_REVIEW) {
          return (
              <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans p-6 text-center">
                  <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
                      <Clock size={48} className="mx-auto text-amber-500 mb-4 animate-pulse" />
                      <h2 className="text-xl font-bold text-slate-900 mb-2">Perfil en Revisión</h2>
                      <p className="text-slate-500 mb-6 text-sm">
                          Hemos recibido tu documentación. Un administrador revisará tu perfil en las próximas 24hs.
                      </p>
                      <button onClick={() => refetchUser()} className="text-green-600 font-bold text-sm">Actualizar Estado</button>
                      <div className="mt-8 pt-4 border-t border-slate-100">
                          <button onClick={handleLogout} className="text-slate-400 text-xs">Cerrar Sesión</button>
                      </div>
                  </div>
              </div>
          );
      }
  }

  // APP CONTENT
  const activeClientRequest = state.requests.find(r => r.clientId === state.currentClient.id && r.status !== JobStatus.CANCELLED); 
  const activeWorkerRequest = state.requests.find(r => r.workerId === state.currentWorker.id && r.status !== JobStatus.CANCELLED && r.status !== JobStatus.COMPLETED);
  const currentUserId = state.currentUserRole === UserRole.CLIENT ? state.currentClient.id : state.currentWorker.id;

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-900 font-sans">
      <div className="w-full max-w-md h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
        
        <AppStateController userRole={state.currentUserRole} onRefreshData={handleAppResume} onGpsRestored={handleGpsRestored} />
        <PushController userId={currentUserId} onNotificationReceived={handleExternalPush} />
        {showPermissions && <PermissionFlow onComplete={handlePermissionsComplete} />}
        <NotificationSystem notifications={state.notifications} currentUserId={currentUserId} onDismiss={dismissNotification} />

        {/* MAIN ROUTER */}
        <div className="flex-1 overflow-hidden relative">
            {currentView === 'WALLET' ? (
                state.currentUserRole === UserRole.CLIENT ? <WalletView onBack={() => setCurrentView('HOME')} /> : <EarningsView currentBalance={state.currentWorker.balance} onBack={() => setCurrentView('HOME')} />
            ) : currentView === 'HISTORY' && historyJobId ? (
                <ActivityHistoryView jobId={historyJobId} currentUserRole={state.currentUserRole} onBack={() => setCurrentView('HOME')} />
            ) : (
                state.currentUserRole === UserRole.CLIENT ? (
                    <ClientView 
                        currentUser={state.currentClient}
                        activeRequest={activeClientRequest || null}
                        onRequestCreate={(req: ServiceRequest) => setState(p => ({...p, requests: [...p.requests, req]}))}
                        onConfirmCompletion={(id: string) => { 
                            setHistoryJobId(id); 
                            setCurrentView('HISTORY'); // Ir directo al historial al terminar
                        }}
                    />
                ) : (
                    <WorkerView 
                        worker={state.currentWorker}
                        activeRequest={activeWorkerRequest || null}
                        onUpdateStatus={(id: string, status: JobStatus) => setState(p => ({...p, requests: p.requests.map(r => r.id === id ? {...r, status} : r)}))}
                        onCompleteJob={(id: string) => setState(p => ({...p, requests: p.requests.map(r => r.id === id ? {...r, status: JobStatus.COMPLETED} : r)}))}
                    />
                )
            )}
        </div>

        {/* GLOBAL MENU */}
        {currentView === 'HOME' && (
             <div className="absolute top-4 right-4 z-[500] flex gap-2">
                 <button onClick={() => setCurrentView('WALLET')} className="bg-white text-slate-900 p-2 rounded-full shadow-lg border border-slate-100 active:scale-95 transition-transform">
                    {state.currentUserRole === UserRole.CLIENT ? <Wallet size={20} /> : <DollarSign size={20} />}
                 </button>
                 <button onClick={handleLogout} className="bg-slate-900 text-white p-2 rounded-full shadow-lg active:scale-95 transition-transform"><LogOut size={20} /></button>
            </div>
        )}
      </div>
    </div>
  );
}

export default App;