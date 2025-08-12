import { api } from './api';

export interface Room {
    _id: string;
    creator: string;
    topic: string;
    participantsLimit: number;
    roomKey: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateRoomData {
    creator: string;
    topic: string;
    participantsLimit: number;
}

export interface JoinRoomData {
    roomKey: string;
    username: string;
}

export const roomAPI = {
    // Create a new room
    createRoom: async (data: CreateRoomData): Promise<Room> => {
        const response = await api.post('/rooms/create', data);
        return response.room || response.data?.room;
    },

    // Join an existing room
    joinRoom: async (data: JoinRoomData): Promise<Room> => {
        const response = await api.post('/rooms/join', data);
        return response.room || response.data?.room;
    },

    // Get room details by room key
    getRoomByKey: async (roomKey: string): Promise<Room> => {
        const response = await api.get(`/rooms/${roomKey}`);
        return response.room || response.data?.room;
    },

    // Get all rooms (if needed for future features)
    getAllRooms: async (): Promise<Room[]> => {
        const response = await api.get('/rooms');
        return response.data.rooms;
    }
}; 