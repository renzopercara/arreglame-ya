"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { 
  ArrowLeft, 
  Bell, 
  Clock3, 
  LogOut, 
  MapPin, 
  ShieldCheck, 
  Star, 
  User as UserIcon,
  Mail,
  Phone,
  Camera,
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import AuthModal from "@/components/AuthModal";
import LoadingButton from "@/components/LoadingButton";
import PaymentReadinessBanner from "@/components/PaymentReadinessBanner";
import ProfileProgressBanner from "@/components/ProfileProgressBanner";
import { toast } from "sonner";

// GraphQL Mutations
const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $email: String, $phone: String, $bio: String) {
    updateProfile(input: { name: $name, email: $email, phone: $phone, bio: $bio }) {
      id
      name
      email
      phone
      bio
    }
  }
`;

const UPDATE_MERCADOPAGO_EMAIL = gql`
  mutation UpdateMercadoPagoEmail($email: String!) {
    updateMercadoPagoEmail(email: $email) {
      id
      mercadopagoEmail
    }
  }
`;

const UPLOAD_AVATAR = gql`
  mutation UploadAvatar($avatar: String!) {
    uploadAvatar(avatar: $avatar) {
      id
      avatar
    }
  }
`;

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, isBootstrapping, logout, updateUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingMercadoPago, setIsEditingMercadoPago] = useState(false);

  // Personal info form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // MercadoPago form state
  const [mpEmail, setMpEmail] = useState(user?.mercadopagoEmail || '');

  // Mutations
  const [updateProfile, { loading: updatingProfile }] = useMutation(UPDATE_PROFILE);
  const [updateMercadoPagoEmail, { loading: updatingMP }] = useMutation(UPDATE_MERCADOPAGO_EMAIL);
  const [uploadAvatar, { loading: uploadingAvatar }] = useMutation(UPLOAD_AVATAR);

  /* ---------------------------- PERSONAL INFO ---------------------------- */
  
  const handleSavePersonalInfo = async () => {
    try {
      const { data } = await updateProfile({
        variables: { name, email, phone },
      });

      if (data?.updateProfile) {
        updateUser(data.updateProfile);
        toast.success('Perfil actualizado correctamente');
        setIsEditingPersonal(false);
      }
    } catch (err: any) {
      toast.error('Error al actualizar perfil', {
        description: err.message,
      });
    }
  };

  /* --------------------------- MERCADO PAGO --------------------------- */
  
  const handleSaveMercadoPago = async () => {
    try {
      const { data } = await updateMercadoPagoEmail({
        variables: { email: mpEmail },
      });

      if (data?.updateMercadoPagoEmail) {
        updateUser({ mercadopagoEmail: data.updateMercadoPagoEmail.mercadopagoEmail });
        toast.success('Email de Mercado Pago actualizado');
        setIsEditingMercadoPago(false);
      }
    } catch (err: any) {
      toast.error('Error al actualizar Mercado Pago', {
        description: err.message,
      });
    }
  };

  /* --------------------------- AVATAR UPLOAD --------------------------- */
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      
      try {
        const { data } = await uploadAvatar({
          variables: { avatar: base64 },
        });

        if (data?.uploadAvatar?.avatar) {
          updateUser({ avatar: data.uploadAvatar.avatar });
          toast.success('Foto de perfil actualizada');
        }
      } catch (err: any) {
        toast.error('Error al subir imagen', {
          description: err.message,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  /* ------------------------------- LOGOUT ------------------------------- */
  
  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    toast.success('Sesión cerrada correctamente');
  };

  /* ---------------------------- RENDER LOGIC ---------------------------- */

  // Show skeleton during bootstrap
  if (isBootstrapping) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-48" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <p className="text-sm font-semibold text-blue-600">Perfil</p>
            <h1 className="text-2xl font-bold text-slate-900">Tu cuenta</h1>
          </div>
        </header>

        <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col items-center gap-4 text-center">
            <UserAvatar size="xl" />
            <div>
              <p className="text-lg font-bold text-slate-900">Usuario invitado</p>
              <p className="text-sm text-slate-500">Inicia sesión para acceder a tu perfil</p>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              Iniciar sesión
            </button>
          </div>
        </section>

        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  const firstName = user.name?.split(' ')[0] || 'Usuario';
  const mpConnected = !!user.mercadopagoEmail || !!user.mercadopagoCustomerId;

  return (
    <div className="flex flex-col gap-6">
      {/* Payment readiness banner */}
      <PaymentReadinessBanner />
      
      {/* Profile progress banner */}
      <ProfileProgressBanner />

      <header className="flex items-center gap-3">
        <button
          onClick={() => router.push('/')}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <p className="text-sm font-semibold text-blue-600">Perfil</p>
          <h1 className="text-2xl font-bold text-slate-900">Hola, {firstName}</h1>
        </div>
      </header>

      {/* BLOCK 6: User Profile Section */}
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          {/* Avatar with upload (BLOCK 5) */}
          <div className="relative">
            <UserAvatar 
              name={user.name} 
              avatar={user.avatar}
              size="xl"
            />
            <label 
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition shadow-lg"
            >
              <Camera className="h-4 w-4" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </label>
          </div>

          <div className="flex-1">
            <p className="text-lg font-bold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {user.rating && (
                <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                  <Star className="h-3 w-3" /> {user.rating.toFixed(1)}
                </span>
              )}
              {user.totalJobs !== undefined && (
                <span className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  <Clock3 className="h-3 w-3" /> {user.totalJobs} trabajos
                </span>
              )}
              {user.status === 'VERIFIED' && (
                <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" /> Verificado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Personal Info Editor */}
        {isEditingPersonal ? (
          <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
              <UserIcon className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
                className="flex-1 border-none bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
              <Mail className="h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 border-none bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
              <Phone className="h-4 w-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Teléfono"
                className="flex-1 border-none bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
              />
            </label>
            <div className="flex gap-2">
              <LoadingButton
                onClick={handleSavePersonalInfo}
                loading={updatingProfile}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Guardar
              </LoadingButton>
              <button
                onClick={() => setIsEditingPersonal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingPersonal(true)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Editar información personal
          </button>
        )}
      </section>

      {/* BLOCK 7: MercadoPago Section */}
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${mpConnected ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <CreditCard className={`h-5 w-5 ${mpConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Mercado Pago</p>
              <p className="text-xs text-slate-500">
                {mpConnected ? 'Cuenta vinculada' : 'No vinculado'}
              </p>
            </div>
          </div>
          {mpConnected ? (
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
        </div>

        {isEditingMercadoPago ? (
          <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
              <Mail className="h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={mpEmail}
                onChange={(e) => setMpEmail(e.target.value)}
                placeholder="Email de Mercado Pago"
                className="flex-1 border-none bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
              />
            </label>
            <div className="flex gap-2">
              <LoadingButton
                onClick={handleSaveMercadoPago}
                loading={updatingMP}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Guardar
              </LoadingButton>
              <button
                onClick={() => setIsEditingMercadoPago(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            {mpConnected ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-xs font-medium text-emerald-800">
                  Email: {user.mercadopagoEmail || 'Configurado'}
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-600">
                  Vincula tu cuenta de Mercado Pago para recibir y realizar pagos de forma segura.
                </p>
              </div>
            )}
            <button
              onClick={() => setIsEditingMercadoPago(true)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              {mpConnected ? 'Editar email' : 'Vincular cuenta'}
            </button>
          </>
        )}
      </section>

      {/* Account Stats */}
      {user.balance !== undefined && (
        <section className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm border border-blue-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
            <DollarSign className="h-4 w-4" />
            Saldo disponible
          </div>
          <p className="text-2xl font-bold text-blue-900">
            ${user.balance.toFixed(2)}
          </p>
        </section>
      )}

      {/* BLOCK 8: Logout Button with Confirmation */}
      <button 
        onClick={() => setShowLogoutModal(true)}
        className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition border border-red-100"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Cerrar sesión?</h3>
            <p className="text-sm text-slate-600 mb-6">
              ¿Estás seguro que deseas cerrar tu sesión?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
