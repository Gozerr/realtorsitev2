import api from './api';

export type Selection = {
  id: number;
  title: string;
  date?: string;
  propertyIds: number[];
  createdAt?: string;
};

export async function fetchSelections(): Promise<Selection[]> {
  try {
    const res = await api.get<Selection[]>('/selections');
    return res.data;
  } catch (err: any) {
    if (err.response && err.response.status === 404) {
      return [];
    }
    throw err;
  }
}

export async function createSelection(title: string): Promise<Selection> {
  const res = await api.post<Selection>('/selections', { title, propertyIds: [] });
  return res.data;
}

export async function addPropertyToSelection(selectionId: number, propertyId: number): Promise<void> {
  const res = await api.get<Selection>(`/selections/${selectionId}`);
  const selection = res.data;
  if (!selection.propertyIds.includes(propertyId)) {
    const updated = [...selection.propertyIds, propertyId];
    await api.put(`/selections/${selectionId}`, { title: selection.title, propertyIds: updated });
  }
}

export async function removePropertyFromSelection(selectionId: number, propertyId: number): Promise<void> {
  const res = await api.get<Selection>(`/selections/${selectionId}`);
  const selection = res.data;
  const updated = selection.propertyIds.filter(id => id !== propertyId);
  await api.put(`/selections/${selectionId}`, { title: selection.title, propertyIds: updated });
}

export async function deleteSelection(selectionId: number): Promise<void> {
  await api.delete(`/selections/${selectionId}`);
}

export async function getSelectionById(selectionId: number): Promise<Selection & { clientToken?: string }> {
  const res = await api.get(`/selections/${selectionId}`);
  return res.data;
}

export async function getClientLikes(selectionId: number): Promise<{ propertyId: number; liked: boolean }[]> {
  const res = await api.get(`/selections/${selectionId}/client-likes`);
  return res.data;
}

export function getClientLink(clientToken: string): string {
  return `${window.location.origin}/client-selection/${clientToken}`;
}

export async function downloadSelectionPdf(selectionId: number): Promise<void> {
  const res = await api.get(`/selections/${selectionId}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `selection_${selectionId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function getSelectionByClientToken(token: string): Promise<any> {
  const res = await api.get(`/selections/client/${token}`);
  return res.data;
}

export async function sendClientLike(token: string, propertyId: number, liked: boolean): Promise<void> {
  await api.post(`/selections/client/${token}/like`, { propertyId, liked });
} 