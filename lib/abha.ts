/**
 * Minimal ABHA helper utilities.
 * This file implements a small, configurable proxy client for ABHA-like APIs.
 *
 * Behavior:
 * - If `process.env.ABHA_API_TOKEN` is set, it will be used as a bearer token.
 * - Otherwise, if `ABHA_TOKEN_URL`, `ABHA_CLIENT_ID` and `ABHA_CLIENT_SECRET` are set,
 *   it will attempt an OAuth client_credentials token fetch.
 * - The actual ABHA endpoint to call is set via `ABHA_API_URL`.
 *
 * NOTE: The exact ABHA endpoint paths depend on the government's API spec. This helper
 * uses a configurable `ABHA_API_URL` and forwards query in a reasonable way. Adjust
 * the path construction as needed to match your environment or the official docs.
 */

type RawPatient = any;

async function getAccessToken(): Promise<string | null> {
  const tokenFromEnv = process.env.ABHA_API_TOKEN;
  if (tokenFromEnv) return tokenFromEnv;

  const tokenUrl = process.env.ABHA_TOKEN_URL;
  const clientId = process.env.ABHA_CLIENT_ID;
  const clientSecret = process.env.ABHA_CLIENT_SECRET;

  if (tokenUrl && clientId && clientSecret) {
    try {
      const resp = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!resp.ok) {
        console.error('Failed to fetch ABHA token', resp.status);
        return null;
      }

      const data = await resp.json();
      return data.access_token || null;
    } catch (err) {
      console.error('Error fetching ABHA token', err);
      return null;
    }
  }

  return null;
}

/**
 * Search patients in ABHA gateway.
 * Returns an array of simplified patient objects compatible with the frontend.
 */
export async function searchPatients(query: string): Promise<RawPatient[]> {
  const apiBase = process.env.ABHA_API_URL; // e.g. https://abha-gateway.example.gov
  if (!apiBase) {
    throw new Error('ABHA_API_URL not configured');
  }

  const token = await getAccessToken();

  // Construct URL — many ABHA endpoints will use a specific path. Keep this configurable.
  const searchUrl = `${apiBase.replace(/\/+$/, '')}/patients/search?query=${encodeURIComponent(query)}`;

  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const resp = await fetch(searchUrl, { headers });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`ABHA search failed ${resp.status} ${text}`);
    }

    const data = await resp.json();

    // Transform response to a list of patient-like objects the UI expects.
    // Many ABHA responses will have nested structures; adapt mapping as needed.
    // Try a few common shapes below, with fallbacks.
    if (Array.isArray(data)) {
      return data.map(normalizePatient);
    }

    // If response contains a `results` or `patients` field
    const arr = data.results || data.patients || data.items || [];
    if (Array.isArray(arr)) return arr.map(normalizePatient);

    return [];
  } catch (err) {
    console.error('Error calling ABHA search:', err);
    throw err;
  }
}

function normalizePatient(p: any) {
  // Heuristic mapping — adapt to the actual ABHA schema when available.
  return {
    id: p.id || p.patientId || p.uhid || p.healthId || null,
    uhid: p.uhid || p.uhId || p.healthId || '',
    first_name: p.first_name || p.givenName || (p.name && p.name.given) || (p.name && p.name[0]) || '',
    last_name: p.last_name || p.familyName || (p.name && p.name.family) || '',
    date_of_birth: p.date_of_birth || p.birthDate || (p.dob ? p.dob : null) || null,
    phone: (p.phone && p.phone[0]) || p.mobile || p.telecom || null,
    email: (p.email && p.email[0]) || p.emailAddress || null,
    raw: p,
  };
}

export default { searchPatients };
