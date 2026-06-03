import type { AxiosResponse } from 'axios';

export function downloadBlobResponse(response: AxiosResponse<Blob>, fallbackFilename = 'archive.zip') {
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = response.headers['content-disposition']?.match(/filename="([^"]+)"/)?.[1] ?? fallbackFilename;
  link.click();
  URL.revokeObjectURL(url);
}
