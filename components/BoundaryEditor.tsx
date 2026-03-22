
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { VastuResult, RoomDetection } from '../types';

interface Props {
  imagePreview: string;
  data: VastuResult;
  onSave: (updatedData: VastuResult) => void;
  onCancel: () => void;
}

const BoundaryEditor: React.FC<Props> = ({ imagePreview, data, onSave, onCancel }) => {
  const [rooms, setRooms] = useState<RoomDetection[]>(data.roomDetections || []);
  const [activeRoomIndex, setActiveRoomIndex] = useState<number | null>(null);
  const [activeHandle, setActiveHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | 'move' | null>(null);
  const [showVastuGrid, setShowVastuGrid] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const boundingBox = useMemo(() => {
    if (rooms.length === 0) return { xmin: 0, ymin: 0, xmax: 1000, ymax: 1000 };
    let xmin = 1000, ymin = 1000, xmax = 0, ymax = 0;
    rooms.forEach(room => {
      const [rymin, rxmin, rymax, rxmax] = room.box2d;
      xmin = Math.min(xmin, rxmin);
      ymin = Math.min(ymin, rymin);
      xmax = Math.max(xmax, rxmax);
      ymax = Math.max(ymax, rymax);
    });
    // Add some padding
    const padding = 20;
    return { 
      xmin: Math.max(0, xmin - padding), 
      ymin: Math.max(0, ymin - padding), 
      xmax: Math.min(1000, xmax + padding), 
      ymax: Math.min(1000, ymax + padding) 
    };
  }, [rooms]);

  const getRotationAngle = (dir?: string) => {
    switch(dir) {
      case 'UP': return 0;
      case 'DOWN': return 180;
      case 'LEFT': return -90;
      case 'RIGHT': return 90;
      case 'TILTED_CLOCKWISE': return 45;
      case 'TILTED_ANTICLOCKWISE': return -45;
      default: return 0;
    }
  };

  const renderVastuGrid = () => {
    if (!showVastuGrid) return null;
    const { xmin, ymin, xmax, ymax } = boundingBox;
    const width = xmax - xmin;
    const height = ymax - ymin;
    const cellW = width / 3;
    const cellH = height / 3;

    const zones = [
      { name: 'NW', color: 'rgba(34, 197, 94, 0.15)' }, { name: 'N', color: 'rgba(59, 130, 246, 0.15)' }, { name: 'NE', color: 'rgba(59, 130, 246, 0.15)' },
      { name: 'W', color: 'rgba(148, 163, 184, 0.15)' }, { name: 'Center', color: 'rgba(245, 158, 11, 0.15)' }, { name: 'E', color: 'rgba(34, 197, 94, 0.15)' },
      { name: 'SW', color: 'rgba(120, 113, 108, 0.15)' }, { name: 'S', color: 'rgba(120, 113, 108, 0.15)' }, { name: 'SE', color: 'rgba(239, 68, 68, 0.15)' },
    ];

    return (
      <g transform={`rotate(${getRotationAngle(data.inferredNorth)}, ${xmin + width/2}, ${ymin + height/2})`}>
        {zones.map((zone, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          return (
            <g key={i}>
              <rect 
                x={xmin + col * cellW} 
                y={ymin + row * cellH} 
                width={cellW} 
                height={cellH} 
                fill={zone.color}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text 
                x={xmin + col * cellW + cellW / 2} 
                y={ymin + row * cellH + cellH / 2} 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-[14px] fill-white/40 font-black uppercase tracking-[0.2em] pointer-events-none select-none"
              >
                {zone.name}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const handleMouseDown = (index: number, handle: 'tl' | 'tr' | 'bl' | 'br' | 'move') => {
    setActiveRoomIndex(index);
    setActiveHandle(handle);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeRoomIndex === null || !activeHandle || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 1000;

    setRooms(prev => {
      const newRooms = [...prev];
      const room = { ...newRooms[activeRoomIndex] };
      let [ymin, xmin, ymax, xmax] = room.box2d;

      const MIN_SIZE = 20;

      if (activeHandle === 'tl') {
        ymin = Math.max(0, Math.min(y, ymax - MIN_SIZE));
        xmin = Math.max(0, Math.min(x, xmax - MIN_SIZE));
      } else if (activeHandle === 'tr') {
        ymin = Math.max(0, Math.min(y, ymax - MIN_SIZE));
        xmax = Math.min(1000, Math.max(x, xmin + MIN_SIZE));
      } else if (activeHandle === 'bl') {
        ymax = Math.min(1000, Math.max(y, ymin + MIN_SIZE));
        xmin = Math.max(0, Math.min(x, xmax - MIN_SIZE));
      } else if (activeHandle === 'br') {
        ymax = Math.min(1000, Math.max(y, ymin + MIN_SIZE));
        xmax = Math.min(1000, Math.max(x, xmin + MIN_SIZE));
      } else if (activeHandle === 'move') {
        const width = xmax - xmin;
        const height = ymax - ymin;
        const dx = x - (xmin + xmax) / 2;
        const dy = y - (ymin + ymax) / 2;
        
        xmin = Math.max(0, Math.min(xmin + dx, 1000 - width));
        ymin = Math.max(0, Math.min(ymin + dy, 1000 - height));
        xmax = xmin + width;
        ymax = ymin + height;
      }

      room.box2d = [ymin, xmin, ymax, xmax];
      newRooms[activeRoomIndex] = room;
      return newRooms;
    });
  };

  const handleMouseUp = () => {
    setActiveRoomIndex(null);
    setActiveHandle(null);
  };

  const saveChanges = () => {
    onSave({ ...data, roomDetections: rooms });
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="max-w-5xl w-full flex flex-col gap-6 h-full">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-serif font-bold text-white">Refine Spatial Boundaries</h2>
            <p className="text-slate-400 text-xs uppercase tracking-widest font-black">Drag corners to adjust room dimensions</p>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setShowVastuGrid(!showVastuGrid)} 
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                showVastuGrid ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {showVastuGrid ? 'Hide Vastu Grid' : 'Show Vastu Grid'}
            </button>
            <div className="w-[1px] h-8 bg-slate-800 mx-2" />
            <button onClick={onCancel} className="px-6 py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors">Cancel</button>
            <button onClick={saveChanges} className="px-6 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors">Apply Changes</button>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="relative flex-1 bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img src={imagePreview} className="w-full h-full object-contain pointer-events-none opacity-50" />
          
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            {renderVastuGrid()}
            
            {rooms.map((room, i) => {
              const [ymin, xmin, ymax, xmax] = room.box2d;
              const isActive = activeRoomIndex === i;
              
              return (
                <g key={i}>
                  <rect 
                    x={xmin} y={ymin} width={xmax - xmin} height={ymax - ymin}
                    fill={isActive ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.1)"}
                    stroke={isActive ? "#10b981" : "#3b82f6"}
                    strokeWidth="2"
                    className="cursor-move"
                    onMouseDown={() => handleMouseDown(i, 'move')}
                  />
                  <text x={xmin + 5} y={ymin + 20} className="text-[12px] fill-white font-bold pointer-events-none select-none">
                    {room.name}
                  </text>
                  
                  {/* Resize Handles */}
                  <circle cx={xmin} cy={ymin} r="8" fill="#fff" stroke="#3b82f6" className="cursor-nwse-resize" onMouseDown={() => handleMouseDown(i, 'tl')} />
                  <circle cx={xmax} cy={ymin} r="8" fill="#fff" stroke="#3b82f6" className="cursor-nesw-resize" onMouseDown={() => handleMouseDown(i, 'tr')} />
                  <circle cx={xmin} cy={ymax} r="8" fill="#fff" stroke="#3b82f6" className="cursor-nesw-resize" onMouseDown={() => handleMouseDown(i, 'bl')} />
                  <circle cx={xmax} cy={ymax} r="8" fill="#fff" stroke="#3b82f6" className="cursor-nwse-resize" onMouseDown={() => handleMouseDown(i, 'br')} />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Instructions</p>
          <ul className="text-xs text-slate-400 space-y-1 list-disc ml-4">
            <li>Drag the center of a box to move the entire room.</li>
            <li>Drag the white circles at the corners to resize the room boundary.</li>
            <li>Ensure the boxes align precisely with the walls in your floor plan.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BoundaryEditor;
