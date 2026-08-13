export interface PlaceResult {
    id: string;
    displayName?: string | null;
    formattedAddress?: string | null;
    nationalPhoneNumber?: string | null;
    websiteURI?: string | null;
    location?: {
      lat: () => number;
      lng: () => number;
    } | null;
  }
  
  export interface SearchError {
    code?: string;
    message: string;
    type: 'auth' | 'api' | 'network' | 'general';
  }
  
  // Augment window to handle Google Maps global callbacks if needed
  declare global {
    interface Window {
      gm_authFailure?: () => void;
      google?: any;
    }
  }