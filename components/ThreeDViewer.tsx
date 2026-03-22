
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// @ts-ignore
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ThreeDModelData } from '../types';

interface Props {
  modelData: ThreeDModelData;
  onAnalyze: (screenshotBase64: string) => void;
  onClose: () => void;
}

const ThreeDViewer: React.FC<Props> = ({ modelData, onAnalyze, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Grid Helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x1e293b, 0x1e293b);
    scene.add(gridHelper);

    // Load Model
    setLoading(true);
    if (modelData.type === 'glb') {
      const loader = new GLTFLoader();
      loader.load(modelData.url, (gltf) => {
        scene.add(gltf.scene);
        fitCameraToObject(camera, gltf.scene, controls);
        setLoading(false);
      }, undefined, (err) => {
        console.error(err);
        setError("Failed to load GLB model.");
        setLoading(false);
      });
    } else {
      const loader = new OBJLoader();
      loader.load(modelData.url, (obj) => {
        scene.add(obj);
        fitCameraToObject(camera, obj, controls);
        setLoading(false);
      }, undefined, (err) => {
        console.error(err);
        setError("Failed to load OBJ model.");
        setLoading(false);
      });
    }

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [modelData]);

  const fitCameraToObject = (camera: THREE.PerspectiveCamera, object: THREE.Object3D, controls: OrbitControls) => {
    const boundingBox = new THREE.Box3( ).setFromObject( object );
    const center = boundingBox.getCenter( new THREE.Vector3() );
    const size = boundingBox.getSize( new THREE.Vector3() );
    const maxDim = Math.max( size.x, size.y, size.z );
    const fov = camera.fov * ( Math.PI / 180 );
    let cameraZ = Math.abs( maxDim / 4 * Math.tan( fov * 2 ) );
    cameraZ *= 3; // zoom out a little
    camera.position.set(center.x + cameraZ, center.y + cameraZ, center.z + cameraZ);
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
  };

  const captureAndAnalyze = () => {
    if (!rendererRef.current) return;
    const base64 = rendererRef.current.domElement.toDataURL('image/jpeg').split(',')[1];
    onAnalyze(base64);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col overflow-hidden">
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-slate-900 font-bold text-xs">3D</div>
          <div>
            <h2 className="font-serif font-bold text-slate-100">{modelData.name}</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none">Interactive 3D Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={captureAndAnalyze}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            Analyze View
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      
      <div className="relative flex-1 overflow-hidden">
        <div ref={containerRef} className="w-full h-full cursor-move" />
        
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-300 font-medium animate-pulse">Loading 3D Environment...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="bg-rose-500/10 border border-rose-500/30 p-8 rounded-3xl max-w-sm">
              <p className="text-rose-400 mb-4 font-bold">{error}</p>
              <button onClick={onClose} className="px-6 py-2 bg-slate-800 rounded-xl text-sm hover:bg-slate-700 transition-colors">Go Back</button>
            </div>
          </div>
        )}

        {/* View Guide */}
        <div className="absolute bottom-6 left-6 right-6 pointer-events-none flex justify-center">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 px-6 py-3 rounded-full text-xs text-slate-400 flex items-center gap-6">
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-slate-700 flex items-center justify-center text-[10px] text-white">L</span> Rotate View</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-slate-700 flex items-center justify-center text-[10px] text-white">R</span> Pan View</div>
            <div className="flex items-center gap-2"><span className="w-8 h-4 rounded bg-slate-700 flex items-center justify-center text-[10px] text-white">Scroll</span> Zoom</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDViewer;
