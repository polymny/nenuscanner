import axios from 'axios';

import { API_URL } from './environment';

export const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
