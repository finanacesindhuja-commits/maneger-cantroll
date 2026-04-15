export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Manager Control';

console.log('--- Configuration Loaded ---');
console.log('API_URL:', API_URL || 'NOT SET (hitting current domain)');
console.log('APP_NAME:', APP_NAME);
