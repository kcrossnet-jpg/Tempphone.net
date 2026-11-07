import { Country } from '../types';

export const COUNTRIES: Country[] = [
  {
    iso: 'US',
    flag: '🇺🇸',
    name: 'United States',
    dial: '1',
    areas: [
      { code: '415', city: 'San Francisco' },
      { code: '212', city: 'New York' },
      { code: '305', city: 'Miami' },
      { code: '512', city: 'Austin' },
      { code: '773', city: 'Chicago' },
      { code: '206', city: 'Seattle' },
      { code: '617', city: 'Boston' },
      { code: '310', city: 'Los Angeles' }
    ]
  },
  {
    iso: 'CA',
    flag: '🇨🇦',
    name: 'Canada',
    dial: '1',
    areas: [
      { code: '416', city: 'Toronto' },
      { code: '604', city: 'Vancouver' },
      { code: '514', city: 'Montreal' },
      { code: '403', city: 'Calgary' }
    ]
  },
  {
    iso: 'GB',
    flag: '🇬🇧',
    name: 'United Kingdom',
    dial: '44',
    areas: [
      { code: '20', city: 'London' },
      { code: '121', city: 'Birmingham' },
      { code: '161', city: 'Manchester' },
      { code: '131', city: 'Edinburgh' }
    ]
  },
  {
    iso: 'DE',
    flag: '🇩🇪',
    name: 'Germany',
    dial: '49',
    areas: [
      { code: '30', city: 'Berlin' },
      { code: '89', city: 'Munich' },
      { code: '40', city: 'Hamburg' },
      { code: '69', city: 'Frankfurt' }
    ]
  },
  {
    iso: 'FR',
    flag: '🇫🇷',
    name: 'France',
    dial: '33',
    areas: [
      { code: '1', city: 'Paris' },
      { code: '4', city: 'Lyon' },
      { code: '9', city: 'Marseille' },
      { code: '5', city: 'Bordeaux' }
    ]
  },
  {
    iso: 'ES',
    flag: '🇪🇸',
    name: 'Spain',
    dial: '34',
    areas: [
      { code: '91', city: 'Madrid' },
      { code: '93', city: 'Barcelona' },
      { code: '96', city: 'Valencia' }
    ]
  },
  {
    iso: 'IT',
    flag: '🇮🇹',
    name: 'Italy',
    dial: '39',
    areas: [
      { code: '06', city: 'Rome' },
      { code: '02', city: 'Milan' },
      { code: '081', city: 'Naples' }
    ]
  },
  {
    iso: 'AU',
    flag: '🇦🇺',
    name: 'Australia',
    dial: '61',
    areas: [
      { code: '2', city: 'Sydney' },
      { code: '3', city: 'Melbourne' },
      { code: '7', city: 'Brisbane' },
      { code: '8', city: 'Perth' }
    ]
  },
  {
    iso: 'JP',
    flag: '🇯🇵',
    name: 'Japan',
    dial: '81',
    areas: [
      { code: '3', city: 'Tokyo' },
      { code: '6', city: 'Osaka' },
      { code: '11', city: 'Sapporo' }
    ]
  },
  {
    iso: 'IN',
    flag: '🇮🇳',
    name: 'India',
    dial: '91',
    areas: [
      { code: '22', city: 'Mumbai' },
      { code: '11', city: 'Delhi' },
      { code: '80', city: 'Bengaluru' },
      { code: '44', city: 'Chennai' }
    ]
  },
  {
    iso: 'BR',
    flag: '🇧🇷',
    name: 'Brazil',
    dial: '55',
    areas: [
      { code: '11', city: 'São Paulo' },
      { code: '21', city: 'Rio de Janeiro' }
    ]
  },
  {
    iso: 'MX',
    flag: '🇲🇽',
    name: 'Mexico',
    dial: '52',
    areas: [
      { code: '55', city: 'Mexico City' },
      { code: '33', city: 'Guadalajara' },
      { code: '81', city: 'Monterrey' }
    ]
  },
  {
    iso: 'ZA',
    flag: '🇿🇦',
    name: 'South Africa',
    dial: '27',
    areas: [
      { code: '11', city: 'Johannesburg' },
      { code: '21', city: 'Cape Town' }
    ]
  },
  {
    iso: 'SG',
    flag: '🇸🇬',
    name: 'Singapore',
    dial: '65',
    areas: [
      { code: '6', city: 'Singapore Central' }
    ]
  },
  {
    iso: 'AE',
    flag: '🇦🇪',
    name: 'United Arab Emirates',
    dial: '971',
    areas: [
      { code: '4', city: 'Dubai' },
      { code: '2', city: 'Abu Dhabi' }
    ]
  }
];

export const MAIL_ADJECTIVES = [
  'reef', 'ash', 'cinder', 'plum', 'wren', 'dune',
  'frost', 'ember', 'moss', 'static', 'echo', 'prism',
  'sol', 'drift', 'sage', 'flint', 'lunar', 'cedar'
];

export const MAIL_DOMAINS = [
  '@yourdomain.com',
  '@tempphone.mail',
  '@burnbox.io',
  '@dropzone.email',
  '@vapor.mail'
];
