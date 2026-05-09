// ─── 用户 ────────────────────────────────────────────────────────────────────

export type UserInfo = {
  id: string;
  name: string | null;
  phone: string;
  role: string;
};

export type MeResponse =
  | { ok: true; user: UserInfo }
  | { ok: false; error: string };

// ─── 出车图片 ─────────────────────────────────────────────────────────────────

export type TripImageType = 'DEPARTURE' | 'ARRIVAL';

export type TripImageItem = {
  id: string;
  type: TripImageType;
  imageUrl: string;
};

// ─── 出车记录 ─────────────────────────────────────────────────────────────────

export type TripStatus = 'IN_TRANSIT' | 'COMPLETED';

/** 列表项（不含图片数据） */
export type TripItem = {
  id: string;
  driverId: string;
  driverName: string;
  licensePlate: string;
  date: string;
  departureLocation: string;
  destination: string;
  cargoType: string;
  numberOfLoads: number;
  totalWeight: number;
  status: TripStatus;
};

/** 详情（含图片） */
export type TripDetail = TripItem & {
  images: TripImageItem[];
};

/** 管理员列表项（含图片，用于表格预览） */
export type AdminTripItem = TripItem & {
  images: TripImageItem[];
};

// ─── API 响应 ─────────────────────────────────────────────────────────────────

export type TripsListResponse =
  | { ok: true; trips: TripItem[] }
  | { ok: false; error: string };

export type TripDetailResponse =
  | { ok: true; trip: TripDetail }
  | { ok: false; error: string };

export type CreateTripResponse =
  | { ok: true; trip: TripItem }
  | { ok: false; error: string; issues?: unknown };

export type AdminTripsResponse =
  | { ok: true; trips: AdminTripItem[]; hasMore: boolean; nextCursor: string | null }
  | { ok: false; error: string };

export type DailySummary = {
  date: string; // YYYY-MM-DD
  tripsCount: number;
  totalWeight: number;
};

export type SummaryResponse =
  | { ok: true; summary: DailySummary[] }
  | { ok: false; error: string };

// ─── Auth（保留原有定义） ──────────────────────────────────────────────────────

export type LoginRequest = {
  phone: string;
};

export type VerifyOtpRequest = {
  phone: string;
  code: string;
  name?: string;
};
