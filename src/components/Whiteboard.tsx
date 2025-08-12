import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Palette, Eraser, RotateCcw, Upload, PenTool } from 'lucide-react';
import socketService from '@/lib/socketService';

interface WhiteboardProps {
    roomId: string;
    onClose: () => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ roomId, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(3);
    const [mode, setMode] = useState<'draw' | 'erase'>('draw');
    const [isConnected, setIsConnected] = useState(false);
    const [userCount, setUserCount] = useState(1);
    const lastEmitTime = useRef(0);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size with high DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';

        ctx.scale(dpr, dpr);

        // Set initial styles
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);

        // Join whiteboard room
        socketService.emit('join-whiteboard-room', roomId);
        setIsConnected(true);

        // Listen for drawing from other users
        socketService.on('drawing', ({ x, y, drawing, color, size, userId }) => {
            if (!drawing) {
                // Start a new path
                ctx.beginPath();
                ctx.moveTo(x, y);
                return;
            }

            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.lineTo(x, y);
            ctx.stroke();
        });

        // Listen for user count updates
        socketService.on('whiteboard-users', (count) => {
            setUserCount(count);
        });

        // Listen for connection status
        socketService.on('whiteboard-connected', () => {
            setIsConnected(true);
        });

        // Listen for canvas state updates
        socketService.on('canvasState', (imageData) => {
            const img = new Image();
            img.onload = () => {
                const rect = canvas.getBoundingClientRect();
                ctx.clearRect(0, 0, rect.width, rect.height);
                ctx.drawImage(img, 0, 0, rect.width, rect.height);
            };
            img.src = imageData;
        });

        // Listen for canvas clear
        socketService.on('clearCanvas', () => {
            ctx.clearRect(0, 0, rect.width, rect.height);
            // Reset background to white
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, rect.width, rect.height);
        });

        return () => {
            socketService.off('drawing');
            socketService.off('canvasState');
            socketService.off('clearCanvas');
            socketService.off('whiteboard-users');
            socketService.off('whiteboard-connected');
            socketService.emit('leave-whiteboard-room', roomId);
        };
    }, [roomId]); // Remove color and brushSize from dependencies

    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set drawing styles (always use current values)
        ctx.strokeStyle = mode === 'erase' ? '#ffffff' : color;
        ctx.lineWidth = mode === 'erase' ? brushSize * 2 : brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Start the path
        ctx.beginPath();
        ctx.moveTo(x, y);
        lastPoint.current = { x, y };
        setIsDrawing(true);

        // Emit drawing start
        socketService.emit('drawing', {
            roomId,
            x,
            y,
            drawing: false,
            color: mode === 'erase' ? '#ffffff' : color,
            size: mode === 'erase' ? brushSize * 2 : brushSize
        });
    }, [roomId, mode, color, brushSize]);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Update context styles
        ctx.strokeStyle = mode === 'erase' ? '#ffffff' : color;
        ctx.lineWidth = mode === 'erase' ? brushSize * 2 : brushSize;

        // Draw the line segment
        ctx.lineTo(x, y);
        ctx.stroke();

        // Store the last point for smoother drawing
        lastPoint.current = { x, y };

        // Emit drawing with throttling for better performance (max 60fps for smoother drawing)
        const now = Date.now();
        if (now - lastEmitTime.current > 16) { // ~60fps for smoother drawing
            socketService.emit('drawing', {
                roomId,
                x,
                y,
                drawing: true,
                color: mode === 'erase' ? '#ffffff' : color,
                size: mode === 'erase' ? brushSize * 2 : brushSize
            });
            lastEmitTime.current = now;
        }
    }, [isDrawing, roomId, mode, color, brushSize]);

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    // Handle touch events with proper passive listener options
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            startDrawing(mouseEvent as any);
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            draw(mouseEvent as any);
        };

        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            stopDrawing();
        };

        // Add touch event listeners with passive: false to allow preventDefault
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, [startDrawing, draw, stopDrawing]);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        // Reset background to white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);

        socketService.emit('clearCanvas', { roomId });
    };



    const colors = [
        '#000000', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#ffa500'
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-[95vw] h-[95vh] max-w-7xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-4">
                        <CardTitle>Collaborative Whiteboard</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            {isConnected ? 'Connected' : 'Disconnected'}
                            <span className="ml-2">• {userCount} user{userCount !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                    {/* Toolbar */}
                    <div className="flex items-center gap-4 mb-4 p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Color:</span>
                            {colors.map((c) => (
                                <button
                                    key={c}
                                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${color === c ? 'border-gray-800 shadow-lg' : 'border-gray-300 hover:border-gray-500'
                                        }`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => {
                                        setColor(c);
                                        setMode('draw');
                                    }}
                                    title={`Select ${c} color`}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Size:</span>
                            <input
                                type="range"
                                min="1"
                                max="15"
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <span className="text-xs text-muted-foreground w-6">{brushSize}</span>
                        </div>

                        <Button
                            variant={mode === 'draw' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMode('draw')}
                            className="transition-all hover:scale-105"
                        >
                            <PenTool className="h-4 w-4 mr-1" />
                            Draw
                        </Button>

                        <Button
                            variant={mode === 'erase' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMode('erase')}
                            className="transition-all hover:scale-105"
                        >
                            <Eraser className="h-4 w-4 mr-1" />
                            Erase
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearCanvas}
                            className="transition-all hover:scale-105"
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    </div>

                    {/* Canvas */}
                    <div className="flex-1 border rounded-lg overflow-hidden bg-white">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full cursor-crosshair bg-white touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Whiteboard; 