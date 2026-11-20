const LOCAL_API_URL = 'http://127.0.0.1:5000';
// En production, le frontend est servi par le meme serveur que l API : on utilise
// l origine de la page (IP ou nom) plutot qu un nom en dur, pour ne pas dependre du DNS.
const PROD_API_URL = window.location.origin;

export const API_URL = import.meta.env.DEV ? LOCAL_API_URL : PROD_API_URL;

const LOCAL_MEDIAMTX_STREAM_URL = 'http://127.0.0.100:8889/cam';
const PROD_MEDIAMTX_STREAM_URL = `${window.location.protocol}//${window.location.hostname}:8889/cam`;

/** MediaMTX WebRTC player URL. */
export const MEDIAMTX_STREAM_URL = import.meta.env.DEV ? LOCAL_MEDIAMTX_STREAM_URL : PROD_MEDIAMTX_STREAM_URL;
