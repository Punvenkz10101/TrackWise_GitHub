/**
 * Tab-Scoped Storage Manager
 * Handles multiple users in the same browser by using tab-specific sessions
 */

// Generate a unique tab ID for this browser tab/window
const generateTabId = (): string => {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create tab ID for this session
const getTabId = (): string => {
    let tabId = sessionStorage.getItem('__trackwise_tab_id');
    if (!tabId) {
        tabId = generateTabId();
        sessionStorage.setItem('__trackwise_tab_id', tabId);
    }
    return tabId;
};

export class TabScopedStorage {
    private tabId: string;
    private userId: string | null = null;

    constructor() {
        this.tabId = getTabId();
    }

    /**
     * Set the current user for this tab
     */
    setUser(userId: string | null) {
        this.userId = userId;

        // Store the current user for this tab in sessionStorage
        if (userId) {
            sessionStorage.setItem(`__trackwise_tab_user_${this.tabId}`, userId);
        } else {
            sessionStorage.removeItem(`__trackwise_tab_user_${this.tabId}`);
        }
    }

    /**
     * Get the current user for this tab
     */
    getUser(): string | null {
        if (!this.userId) {
            this.userId = sessionStorage.getItem(`__trackwise_tab_user_${this.tabId}`);
        }
        return this.userId;
    }

    /**
     * Create a tab-specific key for storage
     */
    private createTabKey(key: string): string {
        const userId = this.getUser();
        if (!userId) {
            // During initialization, we might not have a user set yet
            // Return a temporary key that won't be used for actual storage
            return `tab_${this.tabId}_no_user_${key}`;
        }
        return `tab_${this.tabId}_user_${userId}_${key}`;
    }

    /**
     * Store data for current user in this tab
     */
    setItem(key: string, value: any): void {
        try {
            // If no user is set, we can't store user-specific data
            if (!this.getUser()) {
                return;
            }

            const tabKey = this.createTabKey(key);
            const serializedValue = JSON.stringify({
                value,
                timestamp: Date.now(),
                userId: this.userId,
                tabId: this.tabId
            });

            // Use sessionStorage for tab-specific data
            sessionStorage.setItem(tabKey, serializedValue);
        } catch (error) {
            // Silent error handling
        }
    }

    /**
     * Retrieve data for current user in this tab
     */
    getItem<T>(key: string, defaultValue?: T): T | null {
        try {
            // If no user is set, we can't retrieve user-specific data
            if (!this.getUser()) {
                return defaultValue || null;
            }

            const tabKey = this.createTabKey(key);
            const item = sessionStorage.getItem(tabKey);

            if (!item) {
                return defaultValue || null;
            }

            const parsed = JSON.parse(item);

            // Verify the data belongs to current user and tab
            if (parsed.userId !== this.userId || parsed.tabId !== this.tabId) {
                sessionStorage.removeItem(tabKey);
                return defaultValue || null;
            }

            return parsed.value as T;
        } catch (error) {
            return defaultValue || null;
        }
    }

    /**
     * Remove data for current user in this tab
     */
    removeItem(key: string): void {
        try {
            const tabKey = this.createTabKey(key);
            sessionStorage.removeItem(tabKey);
        } catch (error) {
            // Silent error handling
        }
    }

    /**
     * Clear all data for current user in this tab
     */
    clearUserData(): void {
        const userId = this.getUser();
        if (!userId) {
            return;
        }

        const prefix = `tab_${this.tabId}_user_${userId}_`;

        // Clear all tab-specific data for this user
        const keys = Object.keys(sessionStorage).filter(key => key.startsWith(prefix));
        keys.forEach(key => {
            sessionStorage.removeItem(key);
        });
    }

    /**
     * Clear all data for this tab (all users)
     */
    clearTabData(): void {
        const prefix = `tab_${this.tabId}_`;

        const keys = Object.keys(sessionStorage).filter(key => key.startsWith(prefix));
        keys.forEach(key => sessionStorage.removeItem(key));

        // Also clear tab metadata
        sessionStorage.removeItem('__trackwise_tab_id');
        sessionStorage.removeItem(`__trackwise_tab_user_${this.tabId}`);
    }

    /**
     * Get tab information for debugging
     */
    getTabInfo(): { tabId: string; userId: string | null; dataCount: number } {
        const userId = this.getUser();
        const prefix = userId ? `tab_${this.tabId}_user_${userId}_` : `tab_${this.tabId}_`;
        const dataCount = Object.keys(sessionStorage).filter(key => key.startsWith(prefix)).length;

        return {
            tabId: this.tabId,
            userId,
            dataCount
        };
    }

    /**
     * Static method to clean up old tab data
     */
    static cleanupOldTabs(): void {
        const allKeys = Object.keys(sessionStorage);
        const tabKeys = allKeys.filter(key => key.startsWith('tab_'));

        // Get current timestamp
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        tabKeys.forEach(key => {
            try {
                if (key.startsWith('__trackwise_tab_')) {
                    return; // Skip metadata keys
                }

                const item = sessionStorage.getItem(key);
                if (item) {
                    const parsed = JSON.parse(item);
                    if (parsed.timestamp && (now - parsed.timestamp) > maxAge) {
                        sessionStorage.removeItem(key);
                    }
                }
            } catch (error) {
                // Remove invalid entries
                sessionStorage.removeItem(key);
            }
        });
    }
}

// Create singleton instance
export const tabStorage = new TabScopedStorage();

// Auto-cleanup on initialization
TabScopedStorage.cleanupOldTabs();

export default tabStorage;
