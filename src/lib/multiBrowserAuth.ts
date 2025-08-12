/**
 * Multi-Browser Authentication Manager
 * Handles multiple users in the same browser safely using tab-scoped storage
 */

import { tabStorage } from './tabScopedStorage';
import { jwtDecode } from 'jwt-decode';

type JWTPayload = {
    userId: string;
    name: string;
    email: string;
    exp: number;
};

export class MultiBrowserAuth {
    private static readonly TOKEN_KEY = 'auth_token';
    private static readonly USER_KEY = 'user_data';

    /**
     * Save authentication token for current tab/user
     */
    static saveToken(token: string): void {
        try {
            // Decode token to get user info
            const payload = jwtDecode<JWTPayload>(token);

            // Set the user for this tab
            tabStorage.setUser(payload.userId);

            // Store token in tab-scoped storage
            tabStorage.setItem(this.TOKEN_KEY, token);

            // Store user data
            const userData = {
                id: payload.userId,
                name: payload.name,
                email: payload.email
            };
            tabStorage.setItem(this.USER_KEY, userData);

        } catch (error) {
            throw new Error('Invalid token format');
        }
    }

    /**
 * Get authentication token for current tab/user
 */
    static getToken(): string | null {
        try {
            // Check if there's a user set for this tab first
            const currentUser = tabStorage.getUser();
            if (!currentUser) {
                return null;
            }

            const token = tabStorage.getItem<string>(this.TOKEN_KEY);

            if (!token) {
                return null;
            }

            // Verify token format and expiration
            try {
                const payload = jwtDecode<JWTPayload>(token);
                const currentTime = Date.now() / 1000;

                if (payload.exp <= currentTime) {
                    this.removeToken();
                    return null;
                }

                return token;
            } catch (decodeError) {
                this.removeToken(); // Clean up invalid token
                return null;
            }
        } catch (error) {
            return null;
        }
    }

    /**
     * Get user data for current tab
     */
    static getUser(): any | null {
        // Check if there's a user set for this tab first
        const currentUserId = tabStorage.getUser();
        if (!currentUserId) {
            return null;
        }

        return tabStorage.getItem(this.USER_KEY);
    }

    /**
     * Remove authentication token and user data from current tab
     */
    static removeToken(): void {
        tabStorage.removeItem(this.TOKEN_KEY);
        tabStorage.removeItem(this.USER_KEY);
        console.log('🚪 Token and user data removed from current tab');
    }

    /**
     * Clear all authentication data for current tab
     */
    static clearTabAuth(): void {
        tabStorage.clearUserData();
        console.log('🧹 All auth data cleared for current tab');
    }

    /**
     * Switch user in current tab (logout current, prepare for new user)
     */
    static switchUser(): void {
        const currentUser = this.getUser();
        if (currentUser) {
            console.log(`🔄 Switching user from ${currentUser.email} in current tab`);
        }

        // Clear current user's data from this tab
        this.clearTabAuth();

        // Reset tab user
        tabStorage.setUser(null);

        console.log('✅ Tab ready for new user');
    }

    /**
 * Check if user is authenticated in current tab
 */
    static isAuthenticated(): boolean {
        const token = this.getToken();
        const user = this.getUser();
        const isAuth = !!(token && user);

        console.log(`🔍 Authentication check: ${isAuth ? 'Authenticated' : 'Not authenticated'}`);
        return isAuth;
    }

    /**
     * Validate token against server (for critical operations)
     */
    static async validateTokenWithServer(apiUrl: string): Promise<boolean> {
        const token = this.getToken();
        if (!token) {
            return false;
        }

        try {
            const response = await fetch(`${apiUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('❌ Token validation failed:', error);
            return false;
        }
    }

    /**
     * Get debug info for current tab's authentication state
     */
    static getDebugInfo(): any {
        const tabInfo = tabStorage.getTabInfo();
        const token = this.getToken();
        const user = this.getUser();

        let tokenInfo = null;
        if (token) {
            try {
                const payload = jwtDecode<JWTPayload>(token);
                tokenInfo = {
                    userId: payload.userId,
                    email: payload.email,
                    expiresAt: new Date(payload.exp * 1000).toISOString(),
                    isExpired: payload.exp <= Date.now() / 1000
                };
            } catch (error) {
                tokenInfo = { error: 'Invalid token format' };
            }
        }

        return {
            tab: tabInfo,
            user,
            token: tokenInfo,
            isAuthenticated: this.isAuthenticated()
        };
    }

    /**
     * List all active sessions across tabs (for debugging)
     */
    static getAllTabSessions(): any[] {
        const sessions = [];
        const allKeys = Object.keys(sessionStorage);

        // Find all tab user keys
        const tabUserKeys = allKeys.filter(key => key.startsWith('__trackwise_tab_user_'));

        tabUserKeys.forEach(key => {
            const tabId = key.replace('__trackwise_tab_user_', '');
            const userId = sessionStorage.getItem(key);

            if (userId) {
                // Try to get user data for this tab
                const userDataKey = `tab_${tabId}_user_${userId}_${this.USER_KEY}`;
                const userData = sessionStorage.getItem(userDataKey);

                if (userData) {
                    try {
                        const parsed = JSON.parse(userData);
                        sessions.push({
                            tabId,
                            userId,
                            userData: parsed.value,
                            timestamp: parsed.timestamp
                        });
                    } catch (error) {
                        // Invalid session data
                    }
                }
            }
        });

        return sessions;
    }
}

export default MultiBrowserAuth;
