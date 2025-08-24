export interface ProfileFormData {
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  description: string;
  specialties: string[];
  businessName: string;
  isPublic: boolean;
  socialMedia: {
    instagram: string;
    twitter: string;
    tiktok: string;
    facebook: string;
  };
  sms_notifications: boolean;
}

export interface Service {
  id?: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  barber_id?: string;
}

export interface ServiceAddon {
  id?: string;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
  barber_id?: string;
}

export interface SettingsData {
  profileComplete: boolean;
  servicesComplete: boolean;
  availabilityComplete: boolean;
  stripeConnected: boolean;
  notificationsConfigured: boolean;
}

export type Tab = 'profile' | 'services' | 'addons' | 'availability' | 'earnings'; 