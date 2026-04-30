const LOCAL_API_URL = 'http://127.0.0.1:5000';
const PROD_API_URL = 'http://192.168.0.2:8001';

export const API_URL = import.meta.env.DEV ? LOCAL_API_URL : PROD_API_URL;
