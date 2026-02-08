/**
 * Mercado Pago OAuth Service
 * 
 * Handles the OAuth authorization flow for connecting Mercado Pago accounts
 * Security: Access tokens are never stored in frontend
 */

// Note: MP_OAUTH_BASE_URL kept for reference but OAuth flow handled entirely by backend
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface MercadoPagoOAuthConfig {
  clientId: string;
  redirectUri: string;
  state?: string;
}

/**
 * Initiates Mercado Pago OAuth flow by redirecting to backend endpoint
 * Backend handles OAuth URL generation with proper credentials
 * 
 * @param userId - User ID for state tracking
 */
export async function initiateMercadoPagoOAuth(userId: string): Promise<void> {
  try {
    // Call backend endpoint to get OAuth authorization URL
    // Backend will generate URL with client_id, redirect_uri, etc.
    const response = await fetch(`${BACKEND_API_URL}/api/billing/mercadopago/oauth/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Auth token should be included by API client
      },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to initiate OAuth flow');
    }

    const { authorizationUrl } = await response.json();
    
    // Redirect to Mercado Pago authorization page
    window.location.href = authorizationUrl;
  } catch (error) {
    console.error('Error initiating Mercado Pago OAuth:', error);
    throw error;
  }
}

/**
 * Handles OAuth callback from Mercado Pago
 * Should be called on the callback page after MP redirects back
 * 
 * @param code - Authorization code from MP
 * @param state - State parameter for validation
 */
export async function handleMercadoPagoCallback(
  code: string,
  state: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Send authorization code to backend
    // Backend will exchange it for access token and store securely
    const response = await fetch(`${BACKEND_API_URL}/api/billing/mercadopago/oauth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      throw new Error('Failed to complete OAuth flow');
    }

    const result = await response.json();
    return {
      success: true,
      message: 'Cuenta de Mercado Pago vinculada exitosamente',
    };
  } catch (error) {
    console.error('Error handling Mercado Pago callback:', error);
    return {
      success: false,
      message: 'Error al vincular cuenta de Mercado Pago',
    };
  }
}

/**
 * Initiates debt payment flow
 * Creates a payment preference for settling cash commissions
 * 
 * @param userId - User ID
 * @param debtAmount - Amount of debt to settle in ARS
 */
export async function initiateDebtPayment(
  userId: string,
  debtAmount: number
): Promise<{ preferenceId: string; initPoint: string }> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/billing/debt/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId, amount: debtAmount }),
    });

    if (!response.ok) {
      throw new Error('Failed to create debt payment');
    }

    const { preferenceId, initPoint } = await response.json();
    return { preferenceId, initPoint };
  } catch (error) {
    console.error('Error initiating debt payment:', error);
    throw error;
  }
}
