import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, ZoomOut, X } from 'lucide-react';
import { getCroppedImageBlob } from '../utils/cropImage';
import useBackButtonClose from '../hooks/useBackButtonClose';

// Square (1:1) crop modal — drag to reposition, slider/buttons to zoom.
// imageSrc is expected to be a local blob: URL (from the raw picked file);
// onCropDone receives a JPEG Blob of the final square crop.
const ImageCropModal = ({ imageSrc, onCancel, onCropDone }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

   useBackButtonClose(true, onCancel); 

  const onCropComplete = useCallback((_croppedAreaPercent, croppedAreaPixelsValue) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, 500);
      onCropDone(blob);
    } catch {
      // if cropping fails for any reason, just close without saving —
      // the parent's upload flow already has its own error handling
      onCancel();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-black text-gray-900 text-sm">Adjust photo</span>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* crop area — fixed square viewport */}
        <div className="relative w-full" style={{ height: '320px', backgroundColor: '#101828' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* zoom controls */}
        <div className="px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
            className="text-gray-400 hover:text-gray-700 flex-shrink-0"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="text-gray-400 hover:text-gray-700 flex-shrink-0"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {/* actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={processing || !croppedAreaPixels}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-60"
            style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}
          >
            {processing ? 'Processing...' : 'Use photo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
