import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'firebase/auth';
import { doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export type AssetStatus = 'pending' | 'processing' | 'completed' | 'error' | 'paused';

export interface Asset {
  id: string;
  file: File;
  url: string;
  title: string;
  description: string;
  keywords: string[];
  category?: string;
  batchId: string;
  status: AssetStatus;
  progress: number;
  error?: string;
  confidence?: number;
  createdAt: number;
}

export interface Settings {
  geminiKey: string;
  groqKey?: string;
  groqKeys: string[];
  openaiKey: string;
  titleLengthChars: number;
  keywordCount: number;
  keywordStyle: 'stock' | 'seo' | 'creative';
  titleTone: 'descriptive' | 'seo' | 'artistic';
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  origin: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppState {
  user: User | null;
  isAuthReady: boolean;
  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;
  assets: Asset[];
  settings: Settings;
  logs: LogEntry[];
  isProcessing: boolean;
  searchQuery: string;
  currentBatchId: string;
  addAssets: (files: File[]) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  clearAssets: () => void;
  startNewBatch: () => void;
  removeBatch: (batchId: string) => void;
  updateSettings: (updates: Partial<Settings>) => void;
  setSettings: (settings: Settings) => void;
  setAssets: (assets: Asset[]) => void;
  addLog: (message: string, origin: string, type?: LogEntry['type']) => void;
  clearLogs: () => void;
  setProcessing: (isProcessing: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isAuthReady: false,
  setUser: (user) => set({ user }),
  setAuthReady: (isAuthReady) => set({ isAuthReady }),
  assets: [],
  settings: {
    geminiKey: '',
    groqKeys: [],
    openaiKey: '',
    titleLengthChars: 100,
    keywordCount: 49,
    keywordStyle: 'stock',
    titleTone: 'descriptive',
  },
  logs: [],
  isProcessing: false,
  searchQuery: '',
  currentBatchId: uuidv4(),

  setSettings: (settings) => set({ settings }),
  setAssets: (assets) => set({ assets }),

  addAssets: (files) => set((state) => {
    const newAssets = files.map(file => ({
      id: uuidv4(),
      file,
      url: URL.createObjectURL(file),
      title: '',
      description: '',
      keywords: [],
      category: '',
      batchId: state.currentBatchId,
      status: 'pending' as AssetStatus,
      progress: 0,
      createdAt: Date.now(),
    }));

    if (state.user) {
      const path = `users/${state.user!.uid}/history`;
      
      // Process in chunks of 500 (Firestore batch limit)
      const chunkSize = 500;
      for (let i = 0; i < newAssets.length; i += chunkSize) {
        const chunk = newAssets.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        
        chunk.forEach(asset => {
          batch.set(doc(db, path, asset.id), {
            id: asset.id,
            userId: state.user!.uid,
            fileName: asset.file.name,
            fileType: asset.file.type,
            fileSize: asset.file.size,
            title: asset.title,
            description: asset.description,
            keywords: asset.keywords,
            category: asset.category,
            batchId: asset.batchId,
            status: asset.status,
            progress: asset.progress,
            createdAt: asset.createdAt,
          });
        });
        
        batch.commit().catch((error) => handleFirestoreError(error, OperationType.CREATE, path));
      }
    }

    return { assets: [...state.assets, ...newAssets] };
  }),

  updateAsset: (id, updates) => set((state) => {
    if (state.user) {
      const asset = state.assets.find(a => a.id === id);
      if (asset) {
        const path = `users/${state.user.uid}/history`;
        updateDoc(doc(db, path, id), updates).catch((error) => handleFirestoreError(error, OperationType.UPDATE, path));
      }
    }
    return {
      assets: state.assets.map(asset => 
        asset.id === id ? { ...asset, ...updates } : asset
      )
    };
  }),

  removeAsset: (id) => set((state) => {
    const asset = state.assets.find(a => a.id === id);
    if (asset) URL.revokeObjectURL(asset.url);
    if (state.user) {
      const path = `users/${state.user.uid}/history`;
      deleteDoc(doc(db, path, id)).catch((error) => handleFirestoreError(error, OperationType.DELETE, path));
    }
    return { assets: state.assets.filter(a => a.id !== id) };
  }),

  clearAssets: () => set((state) => {
    if (state.user) {
      const path = `users/${state.user.uid}/history`;
      const chunkSize = 500;
      for (let i = 0; i < state.assets.length; i += chunkSize) {
        const chunk = state.assets.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(a => {
          URL.revokeObjectURL(a.url);
          batch.delete(doc(db, path, a.id));
        });
        batch.commit().catch((error) => handleFirestoreError(error, OperationType.DELETE, path));
      }
    } else {
      state.assets.forEach(a => URL.revokeObjectURL(a.url));
    }
    return { assets: [] };
  }),

  startNewBatch: () => set({ currentBatchId: uuidv4() }),

  removeBatch: (batchId) => set((state) => {
    const assetsToRemove = state.assets.filter(a => a.batchId === batchId);
    if (state.user) {
      const path = `users/${state.user.uid}/history`;
      const chunkSize = 500;
      for (let i = 0; i < assetsToRemove.length; i += chunkSize) {
        const chunk = assetsToRemove.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(a => {
          URL.revokeObjectURL(a.url);
          batch.delete(doc(db, path, a.id));
        });
        batch.commit().catch((error) => handleFirestoreError(error, OperationType.DELETE, path));
      }
    } else {
      assetsToRemove.forEach(a => URL.revokeObjectURL(a.url));
    }
    return { assets: state.assets.filter(a => a.batchId !== batchId) };
  }),

  updateSettings: (updates) => set((state) => {
    const newSettings = { ...state.settings, ...updates };
    if (state.user) {
      const path = 'users';
      updateDoc(doc(db, path, state.user.uid), { settings: newSettings }).catch((error) => handleFirestoreError(error, OperationType.UPDATE, path));
    }
    return { settings: newSettings };
  }),

  addLog: (message, origin, type = 'info') => set((state) => ({
    logs: [{ id: uuidv4(), timestamp: Date.now(), message, origin, type }, ...state.logs].slice(0, 100)
  })),

  clearLogs: () => set({ logs: [] }),

  setProcessing: (isProcessing) => set({ isProcessing }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
