import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

// --- TIPOS UNIFICADOS ---

export interface IPushMessage {
  id: string;
  title: string;
  body: string;
  data: any; // Payload extra (ej: jobId)
}

export type PushPermissionStatus = 'granted' | 'denied' | 'prompt';

export interface INotificationService {
  checkPermission(): Promise<PushPermissionStatus>; // Nuevo mÃƒÂ©todo
  requestPermission(): Promise<boolean>;
  register(): Promise<void>;
  
  // Event Listeners
  onRegistration(callback: (token: string) => void): void;
  onRegistrationError(callback: (error: any) => void): void;
  onMessageReceived(callback: (message: IPushMessage) => void): void;
  onActionPerformed(callback: (action: any) => void): void;
  
  removeAllListeners(): Promise<void>;
}

// --- ADAPTER WEB (SimulaciÃƒÂ³n / Local) ---

class WebNotificationAdapter implements INotificationService {
  private registrationCallback?: (token: string) => void;
  private messageCallback?: (msg: IPushMessage) => void;

  async checkPermission(): Promise<PushPermissionStatus> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'default') return 'prompt';
    return Notification.permission as PushPermissionStatus;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async register(): Promise<void> {
    // En Web Push real, aquÃƒÂ­ irÃƒÂ­a la lÃƒÂ³gica de VAPID keys y Service Worker registration.
    // Para este MVP, simulamos un registro exitoso devolviendo un token falso.
    console.log('[WebPush] Simulando registro...');
    setTimeout(() => {
      if (this.registrationCallback) {
        this.registrationCallback('web-mock-token-' + Date.now());
      }
    }, 500);
  }

  onRegistration(callback: (token: string) => void) {
    this.registrationCallback = callback;
  }

  onRegistrationError(callback: (error: any) => void) {
    // No-op en mock
  }

  onMessageReceived(callback: (message: IPushMessage) => void) {
    this.messageCallback = callback;
    
    // Hack para simular recepciÃƒÂ³n en Web desde el mismo tab (para demos)
    (window as any).simulatePush = (title: string, body: string, data: any) => {
        const msg: IPushMessage = {
            id: Date.now().toString(),
            title,
            body,
            data
        };
        // Mostrar notificaciÃƒÂ³n nativa del navegador si estÃƒÂ¡ permitido
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/icons/icon-192x192.png' });
        }
        callback(msg);
    };
  }

  onActionPerformed(callback: (action: any) => void) {
    // No-op en web simple
  }

  async removeAllListeners() {
    this.registrationCallback = undefined;
    this.messageCallback = undefined;
    delete (window as any).simulatePush;
  }
}

// --- ADAPTER NATIVO (Capacitor) ---

class NativeNotificationAdapter implements INotificationService {
  async checkPermission(): Promise<PushPermissionStatus> {
    const status = await PushNotifications.checkPermissions();
    return status.receive as PushPermissionStatus;
  }

  async requestPermission(): Promise<boolean> {
    const result = await PushNotifications.requestPermissions();
    return result.receive === 'granted';
  }

  async register(): Promise<void> {
    await PushNotifications.register();
  }

  onRegistration(callback: (token: string) => void) {
    PushNotifications.addListener('registration', (token: Token) => {
      callback(token.value);
    });
  }

  onRegistrationError(callback: (error: any) => void) {
    PushNotifications.addListener('registrationError', (error: any) => {
      callback(error);
    });
  }

  onMessageReceived(callback: (message: IPushMessage) => void) {
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      callback({
        id: notification.id,
        title: notification.title || '',
        body: notification.body || '',
        data: notification.data
      });
    });
  }

  onActionPerformed(callback: (action: ActionPerformed) => void) {
    PushNotifications.addListener('pushNotificationActionPerformed', callback);
  }

  async removeAllListeners() {
    await PushNotifications.removeAllListeners();
  }
}

// --- FACTORY ---

export const NotificationAdapter: INotificationService = Capacitor.isNativePlatform()
  ? new NativeNotificationAdapter()
  : new WebNotificationAdapter();
