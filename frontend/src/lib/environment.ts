const LOCAL_API_URL = 'http://127.0.0.1:5000';
const PROD_API_URL = 'http://192.168.0.2:8000';

export const API_URL = import.meta.env.DEV ? LOCAL_API_URL : PROD_API_URL;

const LOCAL_MEDIAMTX_STREAM_URL = 'http://127.0.0.1:8889/cam';
const PROD_MEDIAMTX_STREAM_URL = 'http://192.168.0.2:8889/cam';

/** MediaMTX WebRTC player URL. */
export const MEDIAMTX_STREAM_URL = import.meta.env.DEV ? LOCAL_MEDIAMTX_STREAM_URL : PROD_MEDIAMTX_STREAM_URL;
