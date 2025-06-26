import api from './api';

export type Selection = {
  id: number;
  title: string;
  date?: string;
  propertyIds: number[];
  createdAt?: string;
};

export async function fetchSelections(): Promise<Selection[]> {
  const res = await api.get<Selection[]>('/selections');
  return res.data;
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