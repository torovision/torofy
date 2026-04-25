import React, { useRef, useEffect } from 'react';

const TransparentVideo = ({ src, onEnded }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    // Use an offscreen canvas for processing to improve performance if needed
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let animationFrameId;

    const handleLoadedMetadata = () => {
      // Keep resolution manageable to ensure smooth 60fps flood fill
      const scale = Math.min(1, 600 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = video.videoWidth * scale || 400;
      canvas.height = video.videoHeight * scale || 400;
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
    }

    const renderLoop = () => {
      if (video.paused || video.ended) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }
      
      try {
        if (canvas.width > 0 && canvas.height > 0) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.drawImage(video, 0, 0, w, h);
          const frame = ctx.getImageData(0, 0, w, h);
          const data = frame.data;
          
          // Fast Flood Fill to remove background but keep internal whites (like the 'T')
          // We use a Uint8Array to track visited/background pixels
          const isBackground = new Uint8Array(w * h);
          const queue = [0, w - 1, (h - 1) * w, h * w - 1]; // Start at 4 corners
          let head = 0;
          
          // Tolerance for "white" background
          const threshold = 230;

          while (head < queue.length) {
            const idx = queue[head++];
            if (isBackground[idx]) continue;
            
            const p = idx * 4;
            const r = data[p];
            const g = data[p+1];
            const b = data[p+2];
            
            // If pixel is whitish
            if (r > threshold && g > threshold && b > threshold) {
              isBackground[idx] = 1;
              data[p+3] = 0; // Make transparent
              
              const x = idx % w;
              const y = Math.floor(idx / w);
              
              // Add neighbors
              if (x > 0 && !isBackground[idx - 1]) queue.push(idx - 1);
              if (x < w - 1 && !isBackground[idx + 1]) queue.push(idx + 1);
              if (y > 0 && !isBackground[idx - w]) queue.push(idx - w);
              if (y < h - 1 && !isBackground[idx + w]) queue.push(idx + w);
            }
          }

          // Second pass: Anti-aliasing (Fix the white halo around the logo)
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const idx = y * w + x;
              if (!isBackground[idx]) {
                // If it touches a background pixel, it's an edge
                if (isBackground[idx-1] || isBackground[idx+1] || isBackground[idx-w] || isBackground[idx+w]) {
                  const p = idx * 4;
                  const brightness = (data[p] + data[p+1] + data[p+2]) / 3;
                  // If the edge pixel is quite bright (halo), reduce its alpha drastically
                  if (brightness > 180) {
                    data[p+3] = Math.max(0, 255 - (brightness - 150) * 2);
                  }
                }
              }
            }
          }

          ctx.putImageData(frame, 0, 0);
        }
      } catch (err) {
        // Ignore errors
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    video.muted = true;
    video.defaultMuted = true;
    video.play().catch(e => console.error("Autoplay prevented:", e));

    return () => {
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <video 
        ref={videoRef} 
        src={src} 
        muted 
        autoPlay 
        playsInline
        onEnded={onEnded}
        style={{ display: 'none' }} 
      />
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain' }}
      />
    </div>
  );
};

export default TransparentVideo;
