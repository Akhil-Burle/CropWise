import type { AreaUnit, Role, SoilType } from '@/types';
import type { L } from './localize';

export interface MockCrop {
  id: string;
  name: L;
  scientificName: string;
  /** Average gross revenue per acre per season (INR) under conventional practice. */
  revenuePerAcre: number;
  /** Conventional input + protection cost per acre per season (INR). */
  chemicalCostPerAcre: number;
}

export const CROPS: MockCrop[] = [
  {
    id: 'tomato',
    name: { en: 'Tomato', hi: 'टमाटर', kn: 'ಟೊಮೇಟೊ' },
    scientificName: 'Solanum lycopersicum',
    revenuePerAcre: 62000,
    chemicalCostPerAcre: 21000,
  },
  {
    id: 'potato',
    name: { en: 'Potato', hi: 'आलू', kn: 'ಆಲೂಗಡ್ಡೆ' },
    scientificName: 'Solanum tuberosum',
    revenuePerAcre: 56000,
    chemicalCostPerAcre: 19500,
  },
  {
    id: 'chilli',
    name: { en: 'Chilli', hi: 'मिर्च', kn: 'ಮೆಣಸಿನಕಾಯಿ' },
    scientificName: 'Capsicum annuum',
    revenuePerAcre: 71000,
    chemicalCostPerAcre: 24000,
  },
];

export const cropById = (id: string): MockCrop => CROPS.find((c) => c.id === id) ?? CROPS[0];

export const REGIONS: { state: string; districts: string[] }[] = [
  {
    state: 'Karnataka',
    districts: [
      'Bengaluru Rural', 'Belagavi', 'Chikkaballapur', 'Chitradurga', 'Davanagere', 'Dharwad',
      'Hassan', 'Haveri', 'Kolar', 'Mandya', 'Mysuru', 'Tumakuru',
    ],
  },
  { state: 'Maharashtra', districts: ['Ahmednagar', 'Nashik', 'Pune', 'Satara'] },
  { state: 'Andhra Pradesh', districts: ['Anantapur', 'Chittoor', 'Kurnool'] },
  { state: 'Tamil Nadu', districts: ['Coimbatore', 'Dharmapuri', 'Krishnagiri'] },
  { state: 'Telangana', districts: ['Medak', 'Rangareddy'] },
  { state: 'Uttar Pradesh', districts: ['Agra', 'Farrukhabad'] },
];

export interface MockFarm {
  id: string;
  ownerId: string;
  name: string;
  village: string;
  district: string;
  state: string;
  area: number;
  areaUnit: AreaUnit;
  cropIds: string[];
  soilType: SoilType | null;
  location: { lat: number; lng: number } | null;
  /** Days before today the current crop was planted (drives the season timeline). */
  plantedDaysAgo: number;
}

export const SEED_FARMS: MockFarm[] = [
  {
    id: 'farm-hosahalli',
    ownerId: 'user-ramesh',
    name: 'Hosahalli Tomato Plot',
    village: 'Hosahalli',
    district: 'Kolar',
    state: 'Karnataka',
    area: 2.5,
    areaUnit: 'acre',
    cropIds: ['tomato'],
    soilType: 'red_sandy_loam',
    location: { lat: 13.137, lng: 78.129 },
    plantedDaysAgo: 72,
  },
  {
    id: 'farm-belur',
    ownerId: 'user-ramesh',
    name: 'Belur Potato Field',
    village: 'Belur',
    district: 'Hassan',
    state: 'Karnataka',
    area: 1.8,
    areaUnit: 'acre',
    cropIds: ['potato'],
    soilType: 'red_loam',
    location: { lat: 13.165, lng: 75.865 },
    plantedDaysAgo: 58,
  },
  {
    id: 'farm-byadgi',
    ownerId: 'user-ramesh',
    name: 'Byadgi Chilli Farm',
    village: 'Byadgi',
    district: 'Haveri',
    state: 'Karnataka',
    area: 3.2,
    areaUnit: 'acre',
    cropIds: ['chilli'],
    soilType: 'black_cotton',
    location: { lat: 14.673, lng: 75.487 },
    plantedDaysAgo: 96,
  },
];

export interface MockUser {
  id: string;
  name: string;
  phone: string;
  roles: Role[];
  village: string | null;
  district: string | null;
  state: string | null;
}

export const SEED_USERS: MockUser[] = [
  {
    id: 'user-ramesh',
    name: 'Ramesh Gowda',
    phone: '+919845012345',
    roles: ['farmer'],
    village: 'Hosahalli',
    district: 'Kolar',
    state: 'Karnataka',
  },
  {
    id: 'user-kavya',
    name: 'Dr. Kavya Shetty',
    phone: '+919880054321',
    roles: ['agronomist'],
    village: null,
    district: 'Kolar',
    state: 'Karnataka',
  },
  {
    id: 'user-suresh',
    name: 'Suresh Rao',
    phone: '+919900011122',
    roles: ['agronomist', 'admin'],
    village: null,
    district: 'Bengaluru Rural',
    state: 'Karnataka',
  },
];

export const DEMO_ACCOUNTS: { userId: string; role: Role; description: L }[] = [
  {
    userId: 'user-ramesh',
    role: 'farmer',
    description: {
      en: 'Smallholder with tomato, potato and chilli plots in Karnataka',
      hi: 'कर्नाटक में टमाटर, आलू और मिर्च के खेतों वाले छोटे किसान',
      kn: 'ಕರ್ನಾಟಕದಲ್ಲಿ ಟೊಮೇಟೊ, ಆಲೂಗಡ್ಡೆ ಮತ್ತು ಮೆಣಸಿನಕಾಯಿ ಬೆಳೆಯುವ ಸಣ್ಣ ರೈತ',
    },
  },
  {
    userId: 'user-kavya',
    role: 'agronomist',
    description: {
      en: 'Extension agronomist reviewing farmer diagnoses in Kolar',
      hi: 'कोलार में किसानों के निदान की समीक्षा करने वाली कृषि विशेषज्ञ',
      kn: 'ಕೋಲಾರದಲ್ಲಿ ರೈತರ ರೋಗನಿರ್ಣಯ ಪರಿಶೀಲಿಸುವ ವಿಸ್ತರಣಾ ಕೃಷಿ ತಜ್ಞೆ',
    },
  },
  {
    userId: 'user-suresh',
    role: 'admin',
    description: {
      en: 'KVK coordinator with analytics and rules library access',
      hi: 'विश्लेषण और नियम पुस्तकालय तक पहुंच वाले केवीके समन्वयक',
      kn: 'ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ನಿಯಮ ಗ್ರಂಥಾಲಯ ಪ್ರವೇಶ ಹೊಂದಿರುವ ಕೆವಿಕೆ ಸಂಯೋಜಕ',
    },
  },
];
