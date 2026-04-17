import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useStore, Asset } from '../store/useStore';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthReady, setSettings, setAssets, user, isAuthReady } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Ensure user profile exists
        const path = 'users';
        const userRef = doc(db, path, currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            const userData: any = {
              uid: currentUser.uid,
              email: currentUser.email,
              createdAt: Date.now(),
              settings: {
                geminiKey: '',
                groqKeys: [],
                openaiKey: '',
                titleLengthChars: 100,
                keywordCount: 49,
                keywordStyle: 'stock',
                titleTone: 'descriptive',
              }
            };
            
            if (currentUser.displayName) userData.displayName = currentUser.displayName;
            if (currentUser.photoURL) userData.photoURL = currentUser.photoURL;

            await setDoc(userRef, userData);
          } else {
            // Migrate existing users to have createdAt
            const data = userSnap.data();
            if (!data.createdAt) {
              await setDoc(userRef, { createdAt: Date.now() }, { merge: true });
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, path);
        }
      }
      
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser, setAuthReady]);

  // Sync settings
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const path = 'users';
    const unsubscribe = onSnapshot(doc(db, path, user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.settings) {
          const loadedSettings = { ...data.settings };
          // Migrate old groqKey to groqKeys array
          if (loadedSettings.groqKey && (!loadedSettings.groqKeys || loadedSettings.groqKeys.length === 0)) {
            loadedSettings.groqKeys = [loadedSettings.groqKey];
          }
          if (!loadedSettings.groqKeys) {
            loadedSettings.groqKeys = [];
          }
          setSettings(loadedSettings);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user, isAuthReady, setSettings]);

  // Sync assets
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const path = `users/${user.uid}/history`;
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentAssets = useStore.getState().assets;
      const loadedAssets: any[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // We only have metadata in Firestore, we need to merge with local files if they exist
        const existingAsset = currentAssets.find(a => a.id === data.id);
        
        loadedAssets.push({
          ...data,
          file: existingAsset?.file || new File([], data.fileName, { type: data.fileType }),
          url: existingAsset?.url || ''
        });
      });
      
      // Keep local assets that haven't been synced yet
      const unsyncedAssets = currentAssets.filter(a => !loadedAssets.find(la => la.id === a.id));
      
      setAssets([...loadedAssets, ...unsyncedAssets]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user, isAuthReady, setAssets]);

  if (!isAuthReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#050505] text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="size-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-white/40">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
