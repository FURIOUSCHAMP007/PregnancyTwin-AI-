/**
 * PregnancyTwin AI - Offline Synchronization & Resilience Engine
 * Global interceptor for fetch API that implements Stale-While-Revalidate GET caching,
 * optimistic UI state updates, and transactional request queuing for low-connectivity clinics.
 */

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  description: string;
  patientId: string;
}

// Key definitions for localStorage
const QUEUE_KEY = 'pregnancy_twin_offline_sync_queue';
const CACHE_PATIENTS_KEY = 'pregnancy_twin_cache_patients';
const CACHE_TWIN_PREFIX = 'pregnancy_twin_cache_twin_';

// Save original fetch
const originalFetch = window.fetch;

// Get queue from storage
export function getOfflineQueue(): QueuedRequest[] {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to parse offline sync queue:', err);
    return [];
  }
}

// Save queue to storage
function saveOfflineQueue(queue: QueuedRequest[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    // Dispatch global event to notify UI components
    window.dispatchEvent(new CustomEvent('pregnancy-twin-sync-update', {
      detail: { queueSize: queue.length }
    }));
  } catch (err) {
    console.error('Failed to save offline sync queue:', err);
  }
}

// Add a request to the offline queue
export function enqueueRequest(url: string, method: string, headers: Record<string, string>, body: any, description: string, patientId: string) {
  const queue = getOfflineQueue();
  const newRequest: QueuedRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    method,
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    timestamp: Date.now(),
    description,
    patientId
  };

  queue.push(newRequest);
  saveOfflineQueue(queue);

  // Optimistically update caches so local views reflect the changes immediately
  try {
    applyOptimisticUpdate(newRequest);
  } catch (err) {
    console.error('Failed to apply optimistic offline update:', err);
  }

  return newRequest;
}

// Apply updates to locally cached patient and digital twin data
function applyOptimisticUpdate(req: QueuedRequest) {
  const payload = JSON.parse(req.body);

  if (req.url.includes('/visits') && req.method === 'POST') {
    // Adding a new visit
    const twinKey = `${CACHE_TWIN_PREFIX}${req.patientId}`;
    const cachedTwinStr = localStorage.getItem(twinKey);
    if (cachedTwinStr) {
      const cachedData = JSON.parse(cachedTwinStr);
      const twin = cachedData.twin || cachedData;
      
      if (twin && twin.visits) {
        // Create optimistic visit
        const newVisit = {
          ...payload,
          id: `visit-offline-${req.id}`,
          visitId: `visit-offline-${req.id}`,
          patientId: req.patientId,
          visitNumber: twin.visits.length + 1,
          doctorReviewStatus: 'pending-sync', // Special status indicating queued offline
          isOfflineQueued: true
        };

        // Append to local list
        twin.visits.push(newVisit);
        twin.currentVisit = newVisit;

        // Re-save twin to cache
        localStorage.setItem(twinKey, JSON.stringify(cachedData));
      }
    }
  } else if (req.url.includes('/review') && req.method === 'PATCH') {
    // Reviewing/approving a visit
    const twinKey = `${CACHE_TWIN_PREFIX}${req.patientId}`;
    const cachedTwinStr = localStorage.getItem(twinKey);
    if (cachedTwinStr) {
      const cachedData = JSON.parse(cachedTwinStr);
      const twin = cachedData.twin || cachedData;
      
      if (twin && twin.visits) {
        // Find visit inside URL
        // URL format: /api/patients/:id/visits/:visitId/review
        const urlParts = req.url.split('/');
        const visitIdIndex = urlParts.indexOf('visits') + 1;
        const visitId = urlParts[visitIdIndex];

        const visit = twin.visits.find((v: any) => v.id === visitId || v.visitId === visitId);
        if (visit) {
          visit.doctorReviewStatus = payload.status;
          if (payload.notes) {
            visit.doctorNotes = `${visit.doctorNotes || ''}\n[Offline Note]: ${payload.notes}`;
          }
          localStorage.setItem(twinKey, JSON.stringify(cachedData));
        }
      }
    }
  }
}

// Replay queued requests sequentially when connection is restored
export async function syncOfflineQueue(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0 };
  }

  console.log(`Starting synchronization of ${queue.length} offline queued measurements...`);
  let syncedCount = 0;
  
  // Create a copy to iterate
  const requestsToSync = [...queue];

  for (const req of requestsToSync) {
    try {
      const response = await originalFetch(req.url, {
        method: req.method,
        headers: {
          ...req.headers,
          'Content-Type': 'application/json',
          'x-offline-sync': 'true' // Custom flag for backend logging if needed
        },
        body: req.body
      });

      if (response.ok) {
        syncedCount++;
        incrementSyncedCount(1);
        // Remove from persistent queue
        const currentQueue = getOfflineQueue().filter(q => q.id !== req.id);
        saveOfflineQueue(currentQueue);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Sync failed for request ${req.id}:`, errorData.error || response.statusText);
        // Stop synchronizing to prevent out-of-order execution or payload corruptions
        return { 
          success: false, 
          syncedCount, 
          error: `Failed on step "${req.description}": ${errorData.error || 'Server error'}`
        };
      }
    } catch (err: any) {
      console.error(`Network error during offline sync for request ${req.id}:`, err);
      return { 
        success: false, 
        syncedCount, 
        error: 'Network connection still unstable. Sync paused.' 
      };
    }
  }

  // Clear or force refetch patient list and active twin
  try {
    // Notify the app to trigger refetch
    window.dispatchEvent(new CustomEvent('pregnancy-twin-sync-complete', {
      detail: { syncedCount }
    }));
  } catch (err) {
    console.error('Failed to dispatch sync-complete event:', err);
  }

  return { success: true, syncedCount };
}

// Intercept window.fetch globally to inject offline resilience
export function initOfflineFetchInterceptor() {
  const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlString = input.toString();

    // Only intercept requests directed to our Express backend API
    if (urlString.startsWith('/api/') || urlString.includes(window.location.origin + '/api/')) {
      const parsedUrl = new URL(urlString, window.location.origin);
      const method = init?.method?.toUpperCase() || 'GET';
      const isOnline = navigator.onLine;

      // Header forwarding helper
      const headersObj: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            headersObj[key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
            headersObj[key] = value;
          });
        } else {
          Object.assign(headersObj, init.headers);
        }
      }

      // --- HANDLE GET REQUESTS ---
      if (method === 'GET') {
        const isPatientsList = parsedUrl.pathname === '/api/patients';
        const isTwinData = parsedUrl.pathname.includes('/twin') && parsedUrl.pathname.startsWith('/api/patients/');

        // Local cache key selection
        let cacheKey = '';
        if (isPatientsList) {
          cacheKey = CACHE_PATIENTS_KEY;
        } else if (isTwinData) {
          const patientId = parsedUrl.pathname.split('/')[3]; // /api/patients/:id/twin
          cacheKey = `${CACHE_TWIN_PREFIX}${patientId}`;
        }

        if (!isOnline) {
          // OFFLINE: Return cached data immediately
          if (cacheKey) {
            const cachedContent = localStorage.getItem(cacheKey);
            if (cachedContent) {
              console.log(`[Offline Mode] Serving cached data for ${parsedUrl.pathname}`);
              return new Response(cachedContent, {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'x-offline-cached': 'true' }
              });
            }
          }
          return new Response(JSON.stringify({ error: 'You are currently offline. No cached records available.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // ONLINE: Stale-While-Revalidate or standard fetch
        try {
          const response = await originalFetch(input, init);
          if (response.ok && cacheKey) {
            // Clone response before reading to avoid locking body stream
            const responseClone = response.clone();
            const dataStr = await responseClone.text();
            localStorage.setItem(cacheKey, dataStr);
          }
          return response;
        } catch (networkErr) {
          console.warn(`Fetch to ${parsedUrl.pathname} failed, attempting offline cache fallback:`, networkErr);
          if (cacheKey) {
            const cachedContent = localStorage.getItem(cacheKey);
            if (cachedContent) {
              return new Response(cachedContent, {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'x-offline-cached': 'true' }
              });
            }
          }
          throw networkErr;
        }
      }

      // --- HANDLE POST / PATCH DATA UPDATES ---
      if (method === 'POST' || method === 'PATCH') {
        const isNewVisit = parsedUrl.pathname.endsWith('/visits') && parsedUrl.pathname.startsWith('/api/patients/');
        const isReview = parsedUrl.pathname.endsWith('/review') && parsedUrl.pathname.includes('/visits/');

        if (!isOnline) {
          // OFFLINE: Queue the request
          if (isNewVisit || isReview) {
            const patientId = parsedUrl.pathname.split('/')[3];
            let description = 'Record Biometric Ultrasound Visit';
            if (isReview) {
              description = 'Verify Clinical Measurement';
            }

            const bodyStr = init?.body ? init.body.toString() : '{}';
            const queuedReq = enqueueRequest(urlString, method, headersObj, bodyStr, description, patientId);

            console.log(`[Offline Mode] Queued data update for patient ${patientId}: ${description}`);

            return new Response(JSON.stringify({
              success: true,
              message: 'Measurement saved locally. It will synchronize automatically once clinical connectivity is restored.',
              queued: true,
              requestId: queuedReq.id
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      }
    }

    // Default: forward unmodified request
    return originalFetch(input, init);
  };

  try {
    Object.defineProperty(window, 'fetch', {
      value: customFetch,
      configurable: true,
      writable: true,
      enumerable: true
    });
  } catch (err) {
    console.error('Failed to redefine window.fetch using Object.defineProperty:', err);
    // As a ultimate fallback, we can assign to window.fetch if writable is true
    try {
      (window as any).fetch = customFetch;
    } catch (assignErr) {
      console.error('All fetch override attempts failed:', assignErr);
    }
  }
}

// Synced counter persistence helpers
export function getSyncedCount(): number {
  const stored = localStorage.getItem('pregnancy_twin_total_synced_count');
  if (stored !== null) {
    return parseInt(stored, 10);
  }
  // Initialize to a default base representing pre-populated clinical database visits
  const defaultCount = 42;
  localStorage.setItem('pregnancy_twin_total_synced_count', defaultCount.toString());
  return defaultCount;
}

export function incrementSyncedCount(amount: number = 1) {
  const current = getSyncedCount();
  localStorage.setItem('pregnancy_twin_total_synced_count', (current + amount).toString());
  // Dispatch global event to update components
  window.dispatchEvent(new CustomEvent('pregnancy-twin-sync-update', {
    detail: { queueSize: getOfflineQueue().length }
  }));
}

