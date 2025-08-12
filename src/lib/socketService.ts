import { io, Socket } from 'socket.io-client';
import MultiBrowserAuth from './multiBrowserAuth';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
    private socket: Socket | null = null;
    private isConnecting = false;

    connect(): Socket | null {
        if (this.socket?.connected) {
            return this.socket;
        }

        if (this.isConnecting) {
            return null;
        }

        this.isConnecting = true;

        try {
            // Get the authentication token for the current tab
            let token = null;
            try {
                token = MultiBrowserAuth.getToken();
            } catch (error) {
                // No authentication token available
            }

            if (!token) {
                this.isConnecting = false;
                return null;
            }

            this.socket = io(SOCKET_URL, {
                transports: ['polling', 'websocket'],
                secure: true,
                rejectUnauthorized: false,
                withCredentials: true,
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000,
                auth: {
                    token: token // This is what the server expects!
                }
            });

            this.socket.on('connect', () => {
                this.isConnecting = false;
            });

            this.socket.on('connect_error', (error) => {
                this.isConnecting = false;

                // If it's an authentication error, clear the socket
                if (error.message?.includes('Authentication') || error.message?.includes('Unauthorized')) {
                    this.disconnect();
                }
            });

            this.socket.on('error', (error) => {
                this.isConnecting = false;
            });

            this.socket.on('disconnect', (reason) => {
                this.isConnecting = false;
            });

            return this.socket;
        } catch (error) {
            this.isConnecting = false;
            return null;
        }
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnecting = false;
    }

    /**
     * Force reconnect with new authentication (useful after login/logout)
     */
    reconnectWithAuth(): Socket | null {
        this.disconnect();
        return this.connect();
    }

    /**
     * Check if current socket is authenticated
     */
    isAuthenticated(): boolean {
        const token = MultiBrowserAuth.getToken();
        return !!(this.socket?.connected && token);
    }

    emit(event: string, data: any): void {
        // Check if we have authentication
        const token = MultiBrowserAuth.getToken();
        if (!token) {
            return;
        }

        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            this.connect();
            setTimeout(() => {
                if (this.socket?.connected) {
                    this.socket.emit(event, data);
                }
            }, 1000);
        }
    }

    on(event: string, callback: (...args: any[]) => void): void {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event: string): void {
        if (this.socket) {
            this.socket.off(event);
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

const socketService = new SocketService();
export default socketService; 