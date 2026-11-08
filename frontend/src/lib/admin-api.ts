import { siteConfig } from "./site";

const TOKEN_KEY = "kripty_admin_token";

// Session token lives in sessionStorage so it is dropped when the tab closes.
export const adminToken = {
  get: () => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (value: string) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, value);
    } catch {}
  },
  clear: () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const token = adminToken.get();
  const res = await fetch(`${siteConfig.apiUrl}/api/admin${path}`, {
    ...init,
    headers: {
      // FormData sets its own multipart Content-Type (with boundary); JSON bodies need it set here.
      ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401 && !path.startsWith("/login")) {
    adminToken.clear();
    // Hard redirect: this runs outside React, where the router is unavailable.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (typeof window !== "undefined") window.location.href = "/admin/login";
  }
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.error || `Request failed (${res.status})`, res.status);
  }
  return res;
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const { body } = options;
  const res = await request(path, {
    method: options.method ?? "GET",
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  return res.json();
}

/** Downloads an authenticated CSV export through a temporary object URL. */
export async function downloadCsv(path: string, filename: string) {
  const res = await request(path);
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Types shared by the admin screens ---

export type InquiryStatus = "new" | "contacted" | "in_progress" | "won" | "lost";

export interface Inquiry {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  telegram?: string;
  budget: string;
  details: string;
  status: InquiryStatus;
  notes: string;
  visitorId?: string;
}

export interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
  published: boolean;
  order: number;
}

export interface WorkItem {
  id: string;
  src: string;
  alt: string;
  url?: string;
  published: boolean;
  order: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface Stats {
  totals: {
    inquiries: number;
    newInquiries: number;
    inquiriesLast7Days: number;
    subscribers: number;
    subscribersLast7Days: number;
    winRate: number | null;
  };
  byStatus: Record<InquiryStatus, number>;
  byBudget: Record<string, number>;
  series: { date: string; inquiries: number; subscribers: number }[];
  recent: Inquiry[];
}

// --- Analytics ---

export type Row = { label: string; count: number };

export interface Overview {
  days: number;
  totals: {
    visitors: number;
    newVisitors: number;
    returningVisitors: number;
    sessions: number;
    pageviews: number;
    avgSessionSeconds: number;
    bounceRate: number | null;
    leads: number;
    conversionRate: number | null;
    online: number;
  };
  series: { date: string; visitors: number; pageviews: number; leads: number }[];
  live: { id: string; country: string | null; city: string | null; device: string; browser: string; page: string | null }[];
  sources: Row[];
  campaigns: Row[];
  pages: Row[];
  countries: Row[];
  timezones: Row[];
  devices: Row[];
  browsers: Row[];
  systems: Row[];
  languages: Row[];
  actions: { name: string; label: string; count: number }[];
  scroll: Row[];
  sections: Row[];
}

export interface Lead {
  inquiry?: { id: string; name: string; email: string };
  subscriber?: { id: string; email: string };
}

export interface Visitor {
  id: string;
  firstSeen: string;
  lastSeen: string;
  sessions: number;
  pageviews: number;
  country: string | null;
  city: string | null;
  timezone: string | null;
  language: string | null;
  device: string;
  browser: string;
  os: string;
  screen: string | null;
  ip: string | null;
  firstReferrer: string | null;
  firstLanding: string | null;
  firstSource: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  lastPage?: string | null;
  lead?: Lead | null;
}

export interface VisitorDetail {
  visitor: Visitor;
  lead: Lead | null;
  sessions: {
    id: string;
    startedAt: string;
    lastSeen: string;
    landing: string | null;
    referrer: string | null;
    source: string | null;
    utmCampaign: string | null;
    pageviews: number;
    events: number;
    seconds: number;
  }[];
  events: { sessionId: string; ts: string; name: string; path: string | null; label: string | null }[];
}

// --- Testimonials ---

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar: string | null;
  video: string | null;
  published: boolean;
  order: number;
}

/** Sends a multipart form with upload progress (fetch can't report progress), e.g. for large videos. */
export function apiUpload<T>(path: string, method: "POST" | "PATCH", form: FormData, onProgress?: (percent: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${siteConfig.apiUrl}/api/admin${path}`);
    const token = adminToken.get();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let json: { error?: string } = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status === 401) {
        adminToken.clear();
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/admin/login";
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(json as T);
      else reject(new ApiError(json.error || `Upload failed (${xhr.status})`, xhr.status));
    };
    xhr.onerror = () => reject(new ApiError("Network error while uploading", 0));
    xhr.send(form);
  });
}
