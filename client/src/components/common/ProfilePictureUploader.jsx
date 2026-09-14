import React, { useState, useRef } from 'react';

export function ProfilePictureUploader({ value, onChange, name }) {
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Helper to compress images on upload/snap to avoid 413 Payload Too Large
  const compressImage = (dataUrl, maxWidth = 300, maxHeight = 300, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result);
        onChange(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert('Unable to access webcam. Please check permissions.');
      setShowCameraModal(false);
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawData = canvas.toDataURL('image/jpeg');
      const compressed = await compressImage(rawData);
      onChange(compressed);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setShowCameraModal(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      {value ? (
        <img src={value} alt="Profile Preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0284c7' }} />
      ) : (
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700' }}>
          {name ? name.charAt(0).toUpperCase() : 'U'}
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px' }}>
        <label style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#334155' }}>
          📁 Upload File
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
        <button type="button" onClick={startCamera} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
          📷 Use Camera
        </button>
      </div>

      {showCameraModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '300px', height: '225px', borderRadius: '8px', background: '#000' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={capturePhoto} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Take Photo</button>
              <button type="button" onClick={stopCamera} style={{ background: '#cbd5e1', color: '#334155', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}