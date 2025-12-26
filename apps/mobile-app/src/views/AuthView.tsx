
import React, { useState } from 'react';
import { UserRole } from '../types';
import { Leaf, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { LOGIN_MUTATION, REGISTER_MUTATION } from '../graphql/queries';
import { StorageAdapter } from '../lib/adapters/storage';
import { TermsModal } from '../components/TermsModal';

interface AuthViewProps {
  onLoginSuccess: (user: any) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  
  // Terms State
  const [showTerms, setShowTerms] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [loginMutation, { loading: loginLoading }] = useMutation<any>(LOGIN_MUTATION);
  const [registerMutation, { loading: registerLoading }] = useMutation<any>(REGISTER_MUTATION);

  const isLoading = loginLoading || registerLoading;

  const handlePreSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');

      if (!isLogin) {
          // Trigger Terms Flow for Registration
          setShowTerms(true);
      } else {
          // Direct Login
          handleSubmit();
      }
  };

  const handleTermsAccept = async (metadata: { version: string, userAgent: string, date: string }) => {
      setShowTerms(false);
      await handleSubmit(metadata);
  };

  const handleSubmit = async (termsMetadata?: any) => {
    try {
        if (isLogin) {
            const { data } = await loginMutation({
                variables: { email, password, role }
            });
            
            if (data?.login?.accessToken) {
                await StorageAdapter.set('ay_auth_token', data.login.accessToken);
                onLoginSuccess(data.login.user);
            }
        } else {
            // Register with Terms Metadata
            const { data } = await registerMutation({
                variables: { 
                    email, 
                    password, 
                    name, 
                    role,
                    termsAccepted: true,
                    termsVersion: termsMetadata?.version,
                    termsDate: termsMetadata?.date,
                    userAgent: termsMetadata?.userAgent
                }
            });
            
            if (data?.register?.accessToken) {
                await StorageAdapter.set('ay_auth_token', data.register.accessToken);
                onLoginSuccess(data.register.user);
            }
        }
    } catch (err: any) {
        console.error("Auth Error", err);
        setErrorMsg(err.message || "Error de autenticación");
        setShowTerms(false); // Reset terms on error
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      
      {/* Terms & Conditions Modal */}
      {showTerms && (
          <TermsModal 
            role={role} 
            onAccept={handleTermsAccept} 
            onCancel={() => setShowTerms(false)} 
          />
      )}

      {/* Background Decor */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-green-600 rounded-b-[40%] scale-x-150 z-0" />
      
      <div className="relative z-10 flex-1 flex flex-col px-8 pt-12">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                <Leaf className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold">Bienvenido</h1>
            <p className="text-green-100 text-sm">Ingresá para continuar</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 flex flex-col flex-1 mb-8 animate-in slide-in-from-bottom-10 duration-500">
            
            {/* Role Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button 
                    type="button"
                    onClick={() => setRole(UserRole.CLIENT)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === UserRole.CLIENT ? 'bg-white text-green-700 shadow-sm' : 'text-slate-400'}`}
                >
                    Soy Cliente
                </button>
                <button 
                    type="button"
                    onClick={() => setRole(UserRole.WORKER)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === UserRole.WORKER ? 'bg-white text-green-700 shadow-sm' : 'text-slate-400'}`}
                >
                    Soy Cortador
                </button>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-6">
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>

            {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                    <AlertCircle size={16} /> {errorMsg}
                </div>
            )}

            <form onSubmit={handlePreSubmit} className="space-y-4 flex-1">
                {!isLogin && (
                    <div className="relative">
                        <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Nombre completo"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required={!isLogin}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                        />
                    </div>
                )}

                <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input 
                        type="email" 
                        placeholder="tu@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input 
                        type="password" 
                        placeholder="Contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                    />
                </div>

                {!isLogin && role === UserRole.WORKER && (
                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                        <p className="text-xs text-orange-800">
                            ℹ️ Al registrarte como cortador, deberás pasar una validación de identidad antes de recibir trabajos.
                        </p>
                    </div>
                )}

                <div className="pt-4">
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : (
                            <>
                                {isLogin ? 'Ingresar' : 'Registrarme'} <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-6 text-center">
                <p className="text-slate-500 text-sm">
                    {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="ml-1 text-green-600 font-bold hover:underline"
                    >
                        {isLogin ? 'Registrate acá' : 'Iniciá sesión'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
