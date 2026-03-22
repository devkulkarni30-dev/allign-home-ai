
import React, { useEffect, useRef } from 'react';

interface QRScannerProps {
  onResult: (data: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onResult, onClose }) => {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    // Determine qrbox size based on viewport
    const getQrBoxSize = () => {
      const width = window.innerWidth;
      if (width < 600) {
        return { width: 220, height: 220 };
      } else {
        return { width: 300, height: 300 };
      }
    };

    // @ts-ignore
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    const qrCodeSuccessCallback = (decodedText: string) => {
      onResult(decodedText);
      stopScanner();
    };

    const config = { 
      fps: 10, 
      qrbox: getQrBoxSize(),
      aspectRatio: 1.0 
    };

    html5QrCode.start(
      { facingMode: "environment" }, 
      config, 
      qrCodeSuccessCallback
    ).catch((err: any) => {
      console.error("Unable to start scanning", err);
    });

    return () => {
      stopScanner();
    };
  }, [onResult]);

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        console.log("Scanner stopped");
      }).catch((err: any) => console.error("Error stopping scanner", err));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col items-center justify-center p-4 sm:p-6 backdrop-blur-lg">
      <div className="w-full max-w-md bg-slate-900 rounded-[2rem] border border-slate-800 p-5 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-emerald-500/30 rounded-tl-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-emerald-500/30 rounded-br-[2rem] pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <h2 className="text-lg sm:text-xl font-serif font-bold tracking-tight">Scanner <span className="text-emerald-400">Active</span></h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white"
            aria-label="Close scanner"
          >
            <svg className="w-5 h-5 sm:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div className="relative overflow-hidden rounded-2xl bg-black aspect-square shadow-inner border border-slate-800/50">
          <div id="qr-reader" className="w-full h-full"></div>
          {/* Custom Overlay for better UX on small screens */}
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 flex items-center justify-center">
             <div className="w-full h-full border-2 border-emerald-500/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
             </div>
          </div>
        </div>

        <div className="text-center space-y-2 relative z-10">
          <p className="text-slate-300 text-sm font-medium">Align QR code within the frame</p>
          <p className="text-slate-500 text-xs leading-relaxed max-w-[280px] mx-auto">
            Scan any VaastuAI Architect report QR to instantly view detailed compliance and remedial actions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
