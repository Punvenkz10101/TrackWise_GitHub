/**
 * User-Scoped Storage Manager
 * Ensures all client-side data is properly namespaced by userId
 * Prevents data leakage between different users
 */

type StorageType = 'localStorage' | 'sessionStorage';

export class UserScopedStorage {
    private userId: string | null = null;

    constructor(userId?: string) {
        this.userId = userId || null;
    }

    /**
     * Set the current user ID for scoping
     */
    setUserId(userId: string | null) {
        console.log(`📦 UserScopedStorage: Setting userId to ${userId}`);
        this.userId = userId;
    }

    /**
     * Create a user-scoped key
     */
    private createScopedKey(key: string): string {
        if (!this.userId) {
            throw new Error('Cannot create scoped key: userId not set');
        }
        return `user_${this.userId}_${key}`;
    }

    /**
     * Store data in localStorage with user scoping
     */
    setLocal(key: string, value: any): void {
        try {
            const scopedKey = this.createScopedKey(key);
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(scopedKey, serializedValue);
            console.log(`💾 Stored local: ${scopedKey}`);
        } catch (error) {
            console.error(`❌ Failed to store local data for key ${key}:`, error);
        }
    }

    /**
     * Retrieve data from localStorage with user scoping
     */
    getLocal<T>(key: string, defaultValue?: T): T | null {
        try {
            const scopedKey = this.createScopedKey(key);
            const item = localStorage.getItem(scopedKey);

            if (item === null) {
                return defaultValue || null;
            }

            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`❌ Failed to retrieve local data for key ${key}:`, error);
            return defaultValue || null;
        }
    }

    /**
     * Store data in sessionStorage with user scoping
     */
    setSession(key: string, value: any): void {
        try {
            const scopedKey = this.createScopedKey(key);
            const serializedValue = JSON.stringify(value);
            sessionStorage.setItem(scopedKey, serializedValue);
            console.log(`🗃️ Stored session: ${scopedKey}`);
        } catch (error) {
            console.error(`❌ Failed to store session data for key ${key}:`, error);
        }
    }

    /**
     * Retrieve data from sessionStorage with user scoping
     */
    getSession<T>(key: string, defaultValue?: T): T | null {
        try {
            const scopedKey = this.createScopedKey(key);
            const item = sessionStorage.getItem(scopedKey);

            if (item === null) {
                return defaultValue || null;
            }

            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`❌ Failed to retrieve session data for key ${key}:`, error);
            return defaultValue || null;
        }
    }

    /**
     * Remove user-scoped data from localStorage
     */
    removeLocal(key: string): void {
        try {
            const scopedKey = this.createScopedKey(key);
            localStorage.removeItem(scopedKey);
            console.log(`🗑️ Removed local: ${scopedKey}`);
        } catch (error) {
            console.error(`❌ Failed to remove local data for key ${key}:`, error);
        }
    }

    /**
     * Remove user-scoped data from sessionStorage
     */
    removeSession(key: string): void {
        try {
            const scopedKey = this.createScopedKey(key);
            sessionStorage.removeItem(scopedKey);
            console.log(`🗑️ Removed session: ${scopedKey}`);
        } catch (error) {
            console.error(`❌ Failed to remove session data for key ${key}:`, error);
        }
    }

    /**
     * Clear ALL data for the current user from both storages
     */
    clearAllUserData(): void {
        if (!this.userId) {
            console.warn('⚠️ Cannot clear user data: userId not set');
            return;
        }

        const userPrefix = `user_${this.userId}_`;

        // Clear from localStorage
        const localKeys = Object.keys(localStorage).filter(key => key.startsWith(userPrefix));
        localKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🧹 Cleared local: ${key}`);
        });

        // Clear from sessionStorage
        const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith(userPrefix));
        sessionKeys.forEach(key => {
            sessionStorage.removeItem(key);
            console.log(`🧹 Cleared session: ${key}`);
        });

        console.log(`✅ Cleared all data for user ${this.userId}: ${localKeys.length + sessionKeys.length} items`);
    }

    /**
     * Clear ALL user data from storage (for all users) - use with caution
     */
    static clearAllUsersData(): void {
        console.warn('🚨 Clearing ALL user data from storage');

        // Clear all user-scoped keys from localStorage
        const localUserKeys = Object.keys(localStorage).filter(key => key.startsWith('user_'));
        localUserKeys.forEach(key => localStorage.removeItem(key));

        // Clear all user-scoped keys from sessionStorage
        const sessionUserKeys = Object.keys(sessionStorage).filter(key => key.startsWith('user_'));
        sessionUserKeys.forEach(key => sessionStorage.removeItem(key));

        console.log(`🧹 Cleared all user data: ${localUserKeys.length + sessionUserKeys.length} items`);
    }

    /**
     * Get current user ID
     */
    getUserId(): string | null {
        return this.userId;
    }
}

// Create a singleton instance for global use
export const userStorage = new UserScopedStorage();

// Helper functions for easy access
export const setUserStorageScope = (userId: string | null) => {
    userStorage.setUserId(userId);
};

export const clearUserData = () => {
    userStorage.clearAllUserData();
};

export default userStorage;
