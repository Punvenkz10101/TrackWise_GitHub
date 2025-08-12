import express from "express";
import crypto from "crypto";
import cors from "cors";
import auth from "../middleware/auth.js";

const router = express.Router();

console.log("Room routes loaded");

// Add OPTIONS handler for the create endpoint
router.options('/create', cors());

// Create a room
router.post("/create", auth, async (req, res) => {
    try {
        const { creator, topic, participantsLimit } = req.body;
        
        console.log('Create room request:', {
            creator,
            topic,
            participantsLimit,
            origin: req.headers.origin
        });

        const roomKey = crypto.randomBytes(4).toString("hex");

        if (participantsLimit < 1 || participantsLimit > 10) {
            return res.status(400).json({
                success: false,
                message: "Participant limit must be between 1 and 10",
            });
        }

        // For local development, we'll create a simple room object
        const newRoom = {
            _id: crypto.randomBytes(12).toString("hex"),
            creator: creator || req.user.name,
            topic,
            participantsLimit,
            roomKey,
            createdBy: req.userId, // Associate room with user
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const io = req.app.get('io');
        if (io) {
            io.emit('roomCreated', newRoom);
        }

        res.status(201).json({ success: true, room: newRoom });
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Join a room using a roomKey
router.post("/join", async (req, res) => {
    console.log("Join request:", req.body);
    const { roomKey, username } = req.body;

    if (!roomKey || !username) {
        return res.status(400).json({
            success: false,
            message: "Room key and username are required"
        });
    }

    try {
        // For local development, we'll create a mock room
        // In production, you'd query the database
        const room = {
            _id: crypto.randomBytes(12).toString("hex"),
            roomKey,
            topic: "Study Room",
            creator: "Host",
            participantsLimit: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Get io instance from app
        const io = req.app.get('io');
        if (io) {
            io.to(roomKey).emit('userJoined', { username, roomKey });
        }

        res.json({ 
            success: true, 
            room: {
                roomKey: room.roomKey,
                topic: room.topic,
                creator: room.creator,
                participantsLimit: room.participantsLimit
            } 
        });
    } catch (error) {
        console.error("Error joining room:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error",
            error: error.message 
        });
    }
});

// Get room details
router.get("/:roomKey", async (req, res) => {
    try {
        // For local development, return a mock room
        const room = {
            _id: crypto.randomBytes(12).toString("hex"),
            roomKey: req.params.roomKey,
            topic: "Study Room",
            creator: "Host",
            participantsLimit: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        res.json({ success: true, room });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router; 