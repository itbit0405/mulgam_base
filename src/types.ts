export interface User {
  id: string;
  nickname: string;
  profileImage: string;
  email: string;
  role: 'user' | 'artist_pending' | 'artist' | 'admin';
  serialNumber?: string; // e.g., "ART-2026"
  instagramUrl?: string;
  webpageUrl?: string;
  uploadedFiles?: { name: string; url: string; type: 'image' | 'video' }[];
  favoriteArtists: string[]; // List of artist serial numbers favorited by this user
  fanUsers: { nickname: string; id: string }[]; // List of users who added this artist
  description?: string;
}

export interface ArtistMock {
  name: string;
  serialNumber: string;
  description: string;
  profileImage: string;
  instagramUrl: string;
  webpageUrl: string;
  recentExhibitions: { title: string; period: string; venue: string }[];
}

export interface ExhibitionNotification {
  id: string;
  artistName: string;
  artistSerialNumber: string;
  title: string;
  content: string;
  date: string;
}
