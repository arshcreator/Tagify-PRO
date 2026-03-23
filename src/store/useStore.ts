import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'firebase/auth';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
      newAssets.forEach(asset => {
        setDoc(doc(db, `users/${state.user!.uid}/history`, asset.id), {
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
        }).catch(console.error);
      });
    }

    return { assets: [...state.assets, ...newAssets] };
  }),

  updateAsset: (id, updates) => set((state) => {
    if (state.user) {
      const asset = state.assets.find(a => a.id === id);
      if (asset) {
        updateDoc(doc(db, `users/${state.user.uid}/history`, id), updates).catch(console.error);
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
      deleteDoc(doc(db, `users/${state.user.uid}/history`, id)).catch(console.error);
    }
    return { assets: state.assets.filter(a => a.id !== id) };
  }),

  clearAssets: () => set((state) => {
    state.assets.forEach(a => {
      URL.revokeObjectURL(a.url);
      if (state.user) {
        deleteDoc(doc(db, `users/${state.user.uid}/history`, a.id)).catch(console.error);
      }
    });
    return { assets: [] };
  }),

  startNewBatch: () => set({ currentBatchId: uuidv4() }),

  removeBatch: (batchId) => set((state) => {
    const assetsToRemove = state.assets.filter(a => a.batchId === batchId);
    assetsToRemove.forEach(a => {
      URL.revokeObjectURL(a.url);
      if (state.user) {
        deleteDoc(doc(db, `users/${state.user.uid}/history`, a.id)).catch(console.error);
      }
    });
    return { assets: state.assets.filter(a => a.batchId !== batchId) };
  }),

  updateSettings: (updates) => set((state) => {
    const newSettings = { ...state.settings, ...updates };
    if (state.user) {
      updateDoc(doc(db, 'users', state.user.uid), { settings: newSettings }).catch(console.error);
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
