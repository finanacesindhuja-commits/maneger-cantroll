// All backend requests go directly to Render cloud backend.
// No local backend server or PM2 is required.
const defaultRenderUrl = 'https://maneger-cantroll.onrender.com';
const envUrl = import.meta.env.VITE_API_URL;

export const API_URL = (envUrl || defaultRenderUrl).replace(/\/$/, '');
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Manager Control';

console.log('--- Configuration Loaded ---');
console.log('API_URL:', API_URL);
console.log('APP_NAME:', APP_NAME);
