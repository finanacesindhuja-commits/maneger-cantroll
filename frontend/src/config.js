const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const prodUrl = 'https://maneger-cantroll.onrender.com';

export const API_URL = (import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5001' : prodUrl)).replace(/\/$/, '');
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Manager Control';

console.log('--- Configuration Loaded ---');
console.log('API_URL:', API_URL);
console.log('APP_NAME:', APP_NAME);
