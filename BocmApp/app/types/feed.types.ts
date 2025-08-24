export type FeedItem = {
  id: string;
  // Public or signed URL to the video file.
  videoUrl: string; // TODO: Resolve via Supabase Storage signed URL.
  // Optional poster frame for faster first paint.
  posterUrl?: string; // TODO: Precomputed thumbnail or storage URL
  caption?: string;
  username?: string;
  music?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  // BocmApp specific fields
  barber_id?: string;
  barber_name?: string;
  barber_avatar?: string;
  created_at?: string;
  aspect_ratio?: number;
  duration?: number;
  view_count?: number;
  reach_count?: number;
  // Location-based fields
  distance?: number; // Distance in kilometers from user
  barber_location?: string; // Barber's city/state
};

export type VideoState = 'loading' | 'ready' | 'playing' | 'paused' | 'unloaded' | 'error';

export type FeedOptions = {
  pageSize?: number;
  prefetchAhead?: number; // how many items ahead to pre‐load metadata
  enableVirtualization?: boolean;
  enablePreloading?: boolean;
};
