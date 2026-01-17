import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from "firebase/auth";
import {
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp
} from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";
import { UserProfile, HistoricalEntry } from "../types";

// Auth functions
export const signInWithGoogle = async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
};

export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// User Profile functions
export const saveUserProfile = async (userId: string, profile: UserProfile): Promise<void> => {
    await setDoc(doc(db, "users", userId), {
        ...profile,
        updatedAt: Timestamp.now()
    });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            name: data.name,
            age: data.age,
            activityLevel: data.activityLevel,
            sensitivity: data.sensitivity,
            mainActivity: data.mainActivity,
            alertThreshold: data.alertThreshold,
            notificationsEnabled: data.notificationsEnabled
        };
    }
    return null;
};

// History functions
export const saveHistoryEntry = async (userId: string, entry: HistoricalEntry): Promise<void> => {
    await addDoc(collection(db, "users", userId, "history"), {
        ...entry,
        timestamp: Timestamp.now()
    });
};

export const getHistory = async (userId: string, limitCount: number = 90): Promise<HistoricalEntry[]> => {
    const historyRef = collection(db, "users", userId, "history");
    const q = query(historyRef, orderBy("timestamp", "desc"), limit(limitCount));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            date: data.date,
            aqi: data.aqi,
            city: data.city,
            pes: data.pes
        };
    }).reverse(); // Reverse to get chronological order
};
