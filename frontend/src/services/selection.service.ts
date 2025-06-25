import { Property } from '../types';

export type Selection = {
  id: number;
  title: string;
  client?: string;
  date: string;
  propertyIds: number[];
};

const STORAGE_KEY = 'selections';

function getSelections(): Selection[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveSelections(selections: Selection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
}

export function fetchSelections(): Promise<Selection[]> {
  return Promise.resolve(getSelections());
}

export function createSelection(title: string): Promise<Selection> {
  const selections = getSelections();
  const newSelection: Selection = {
    id: Date.now(),
    title,
    date: new Date().toLocaleDateString('ru-RU'),
    propertyIds: [],
  };
  selections.push(newSelection);
  saveSelections(selections);
  return Promise.resolve(newSelection);
}

export function addPropertyToSelection(selectionId: number, propertyId: number): Promise<void> {
  const selections = getSelections();
  const idx = selections.findIndex(s => s.id === selectionId);
  if (idx !== -1 && !selections[idx].propertyIds.includes(propertyId)) {
    selections[idx].propertyIds.push(propertyId);
    saveSelections(selections);
  }
  return Promise.resolve();
} 