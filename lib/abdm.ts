const ABDM_SANDBOX_BASE_URL = process.env.ABDM_SANDBOX_BASE_URL || 'https://abhasbx.abdm.gov.in/abha/api/v3';
const ABDM_SANDBOX_TOKEN = process.env.ABDM_SANDBOX_TOKEN;

async function sandboxRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(ABDM_SANDBOX_TOKEN ? { Authorization: `Bearer ${ABDM_SANDBOX_TOKEN}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${ABDM_SANDBOX_BASE_URL}${path}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`ABDM sandbox request failed (${response.status}): ${message || 'Unknown error'}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error('ABDM sandbox API error:', error);
    throw error;
  }
}

export async function generateMobileOTP(payload: { mobile: string }) {
  return sandboxRequest('/phr/web/login/mobile/generateOtp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyOTP(payload: { txnId: string; otp: string }) {
  return sandboxRequest('/phr/web/login/mobile/verifyOtp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createABHA(payload: Record<string, unknown>) {
  return sandboxRequest('/registration/aadhaar/createHealthIdWithPreVerified', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function searchABHA(payload: { abhaAddress?: string; abhaNumber?: string }) {
  return sandboxRequest('/search/searchByHealthIdToLogin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function linkABHA(payload: Record<string, unknown>) {
  return sandboxRequest('/account/link/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
