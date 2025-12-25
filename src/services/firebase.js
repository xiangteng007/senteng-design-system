// Firebase Configuration and Authentication Service
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    getDocs,
    serverTimestamp,
    query,
    orderBy,
} from 'firebase/firestore';

// Firebase configuration - use environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();

// Default role configuration
const DEFAULT_ROLES = {
    super_admin: {
        name: 'super_admin',
        level: 3,
        allowedPages: [
            'dashboard', 'schedule', 'projects', 'clients', 'finance',
            'vendors', 'inventory', 'materials', 'invoice', 'unit', 'cost', 'calc',
            'user-management'
        ],
    },
    admin: {
        name: 'admin',
        level: 2,
        allowedPages: [
            'dashboard', 'schedule', 'projects', 'clients', 'finance',
            'vendors', 'inventory', 'materials'
        ],
    },
    user: {
        name: 'user',
        level: 1,
        allowedPages: ['dashboard', 'schedule', 'projects'],
    },
};

// ==================== Auth Functions ====================

/**
 * Sign in with Google
 * @returns {Promise<Object>} User object with role info
 */
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user exists in Firestore, if not create new user
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            // First user becomes super_admin, others are users
            const usersCollection = await getDocs(collection(db, 'users'));
            const isFirstUser = usersCollection.empty;

            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: isFirstUser ? 'super_admin' : 'user',
                googleId: user.uid,
                lineUserId: null,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
            });
        } else {
            // Update last login
            await updateDoc(doc(db, 'users', user.uid), {
                lastLogin: serverTimestamp(),
            });
        }

        return await getUserWithRole(user.uid);
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
    }
};

/**
 * Sign out
 */
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

/**
 * Get current auth state
 * @param {Function} callback - Callback function receiving user object
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAuthState = (callback) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userWithRole = await getUserWithRole(firebaseUser.uid);
            callback(userWithRole);
        } else {
            callback(null);
        }
    });
};

/**
 * Get user data with role information
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User object with role and allowed pages
 */
export const getUserWithRole = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));

        if (!userDoc.exists()) {
            return null;
        }

        const userData = userDoc.data();
        const roleConfig = await getRoleConfig(userData.role);

        return {
            uid,
            ...userData,
            allowedPages: roleConfig?.allowedPages || DEFAULT_ROLES.user.allowedPages,
            roleLevel: roleConfig?.level || 1,
        };
    } catch (error) {
        console.error('Error getting user with role:', error);
        throw error;
    }
};

// ==================== Role Functions ====================

/**
 * Get role configuration
 * @param {string} roleName - Role name
 * @returns {Promise<Object>} Role configuration
 */
export const getRoleConfig = async (roleName) => {
    try {
        const roleDoc = await getDoc(doc(db, 'roles', roleName));

        if (roleDoc.exists()) {
            return roleDoc.data();
        }

        // Return default role config if not found in Firestore
        return DEFAULT_ROLES[roleName] || DEFAULT_ROLES.user;
    } catch (error) {
        console.error('Error getting role config:', error);
        return DEFAULT_ROLES[roleName] || DEFAULT_ROLES.user;
    }
};

/**
 * Get all roles
 * @returns {Promise<Array>} Array of role configurations
 */
export const getAllRoles = async () => {
    try {
        const rolesCollection = await getDocs(collection(db, 'roles'));

        if (rolesCollection.empty) {
            // Return default roles if no roles in Firestore
            return Object.values(DEFAULT_ROLES);
        }

        return rolesCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting all roles:', error);
        return Object.values(DEFAULT_ROLES);
    }
};

/**
 * Update role configuration (super_admin only)
 * @param {string} roleName - Role name
 * @param {Object} roleData - Role configuration data
 */
export const updateRoleConfig = async (roleName, roleData) => {
    try {
        await setDoc(doc(db, 'roles', roleName), roleData, { merge: true });
    } catch (error) {
        console.error('Error updating role config:', error);
        throw error;
    }
};

// ==================== User Management Functions ====================

/**
 * Get all users (for super_admin)
 * @returns {Promise<Array>} Array of users
 */
export const getAllUsers = async () => {
    try {
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const usersCollection = await getDocs(usersQuery);

        return usersCollection.docs.map(doc => ({
            uid: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
};

/**
 * Update user role (super_admin only)
 * @param {string} uid - User ID
 * @param {string} newRole - New role name
 */
export const updateUserRole = async (uid, newRole) => {
    try {
        await updateDoc(doc(db, 'users', uid), {
            role: newRole,
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
};

/**
 * Delete user (super_admin only)
 * Note: This only removes user from Firestore, not from Firebase Auth
 * @param {string} uid - User ID
 */
export const deleteUser = async (uid) => {
    try {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

// ==================== Initialize Default Roles ====================

/**
 * Initialize default roles in Firestore (run once on setup)
 */
export const initializeDefaultRoles = async () => {
    try {
        for (const [roleName, roleConfig] of Object.entries(DEFAULT_ROLES)) {
            const roleDoc = await getDoc(doc(db, 'roles', roleName));
            if (!roleDoc.exists()) {
                await setDoc(doc(db, 'roles', roleName), roleConfig);
            }
        }
        console.log('Default roles initialized');
    } catch (error) {
        console.error('Error initializing default roles:', error);
    }
};

// Export constants
export { auth, db, DEFAULT_ROLES };
