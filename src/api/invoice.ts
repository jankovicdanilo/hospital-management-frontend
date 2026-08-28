import { throwApiError, authHeaders } from './apiErrors';

const INVOICE_BASE_URL = import.meta.env.VITE_INVOICE_SERVICE_URL as string;

export type InvoiceFormat = 'pdf' | 'docx';

export async function downloadInvoice(
  appointmentId: number,
  format: InvoiceFormat,
  token: string,
): Promise<Blob> {
  const response = await fetch(`${INVOICE_BASE_URL}/api/billing/${appointmentId}?format=${format}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.blob();
}
