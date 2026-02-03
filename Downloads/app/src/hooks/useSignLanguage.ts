import { useState, useRef, useCallback, useEffect } from 'react';
import { Hands, type Results } from '@mediapipe/hands';

// Finger indices in MediaPipe Hands landmarks
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_TIP = 8;
const MIDDLE_PIP = 10;
const MIDDLE_TIP = 12;
const RING_PIP = 14;
const RING_TIP = 16;
const PINKY_PIP = 18;
const PINKY_TIP = 20;

// Helper function to check if a finger is extended
// A finger is extended if the tip is farther from the wrist than the PIP joint
function isFingerExtended(landmarks: any[], tipIdx: number, pipIdx: number): boolean {
  const wrist = landmarks[WRIST];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  
  const tipDist = Math.sqrt(
    Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2)
  );
  const pipDist = Math.sqrt(
    Math.pow(pip.x - wrist.x, 2) + Math.pow(pip.y - wrist.y, 2)
  );
  
  return tipDist > pipDist * 1.1; // Tip should be significantly farther
}

// Check if thumb is extended (different logic due to thumb anatomy)
function isThumbExtended(landmarks: any[]): boolean {
  const thumbTip = landmarks[THUMB_TIP];
  const wrist = landmarks[WRIST];
  const indexMcp = landmarks[5];
  
  // Thumb is extended if tip is far from wrist
  const tipDist = Math.sqrt(
    Math.pow(thumbTip.x - wrist.x, 2) + Math.pow(thumbTip.y - wrist.y, 2)
  );
  const refDist = Math.sqrt(
    Math.pow(indexMcp.x - wrist.x, 2) + Math.pow(indexMcp.y - wrist.y, 2)
  );
  
  return tipDist > refDist * 1.2;
}

// Get finger states
function getFingerStates(landmarks: any[]) {
  return {
    thumb: isThumbExtended(landmarks),
    index: isFingerExtended(landmarks, INDEX_TIP, INDEX_PIP),
    middle: isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP),
    ring: isFingerExtended(landmarks, RING_TIP, RING_PIP),
    pinky: isFingerExtended(landmarks, PINKY_TIP, PINKY_PIP),
  };
}

// ASL Alphabet gesture recognition
function recognizeASL(landmarks: any[]): { letter: string | null; confidence: number } {
  const fingers = getFingerStates(landmarks);
  const { thumb, index, middle, ring, pinky } = fingers;
  
  // Count extended fingers
  const extendedCount = [thumb, index, middle, ring, pinky].filter(Boolean).length;
  
  // Letter E: All fingers curled into fist (0 extended) - CHECK FIRST
  if (extendedCount === 0) {
    return { letter: 'E', confidence: 0.9 };
  }
  
  // Letter O: Thumb and index form O, others curled - CHECK BEFORE A
  if (!index && !middle && !ring && !pinky && thumb) {
    const thumbTip = landmarks[THUMB_TIP];
    const indexTip = landmarks[INDEX_TIP];
    // Check if thumb is close to index finger area
    const dist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
    );
    if (dist < 0.15) {
      return { letter: 'O', confidence: 0.85 };
    }
  }
  
  // Letter A: Fist, thumb on side (only thumb extended, not close to index)
  if (!index && !middle && !ring && !pinky && thumb) {
    const thumbTip = landmarks[THUMB_TIP];
    const indexTip = landmarks[INDEX_TIP];
    const dist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
    );
    // Only A if thumb is NOT close to index (O takes precedence)
    if (dist >= 0.15) {
      return { letter: 'A', confidence: 0.9 };
    }
  }
  
  // Letter B: All fingers up, palm forward
  if (index && middle && ring && pinky && !thumb) {
    return { letter: 'B', confidence: 0.9 };
  }
  
  // Letter C: Curved C shape - all fingers curved together
  {
    const wrist = landmarks[WRIST];
    const thumbTip = landmarks[THUMB_TIP];
    const indexTip = landmarks[INDEX_TIP];
    const middleTip = landmarks[MIDDLE_TIP];
    const ringTip = landmarks[RING_TIP];
    const pinkyTip = landmarks[PINKY_TIP];
    
    const thumbDist = Math.sqrt(Math.pow(thumbTip.x - wrist.x, 2) + Math.pow(thumbTip.y - wrist.y, 2));
    const indexDist = Math.sqrt(Math.pow(indexTip.x - wrist.x, 2) + Math.pow(indexTip.y - wrist.y, 2));
    const middleDist = Math.sqrt(Math.pow(middleTip.x - wrist.x, 2) + Math.pow(middleTip.y - wrist.y, 2));
    const ringDist = Math.sqrt(Math.pow(ringTip.x - wrist.x, 2) + Math.pow(ringTip.y - wrist.y, 2));
    const pinkyDist = Math.sqrt(Math.pow(pinkyTip.x - wrist.x, 2) + Math.pow(pinkyTip.y - wrist.y, 2));
    
    // All fingers roughly same distance from wrist (curved together in C shape)
    const maxDist = Math.max(thumbDist, indexDist, middleDist, ringDist, pinkyDist);
    const minDist = Math.min(thumbDist, indexDist, middleDist, ringDist, pinkyDist);
    
    // Curved C: all fingers close together in distance from wrist, not fully extended
    if (maxDist - minDist < 0.15 && maxDist < 0.5 && maxDist > 0.15) {
      return { letter: 'C', confidence: 0.8 };
    }
  }
  
  // Letter D: Index up, others curled (thumb must also be curled)
  if (index && !middle && !ring && !pinky && !thumb) {
    return { letter: 'D', confidence: 0.9 };
  }
  
  // Letter F: Thumb and index touching (circle), middle/ring/pinky extended
  // Note: index may not register as extended since it's curved to touch thumb
  if (middle && ring && pinky) {
    const thumbTip = landmarks[THUMB_TIP];
    const indexTip = landmarks[INDEX_TIP];
    const dist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
    );
    // Thumb and index close together (OK sign)
    if (dist < 0.15) {
      return { letter: 'F', confidence: 0.8 };
    }
  }
  
  // Letter G: Index pointing sideways (like pointing gun)
  if (index && !middle && !ring && !pinky && thumb) {
    // Check if index is pointing horizontally
    const indexTip = landmarks[INDEX_TIP];
    const indexMcp = landmarks[INDEX_MCP];
    const horizontal = Math.abs(indexTip.x - indexMcp.x) > Math.abs(indexTip.y - indexMcp.y);
    if (horizontal) {
      return { letter: 'G', confidence: 0.8 };
    }
  }
  
  // Letter I: Pinky up, others curled
  if (!index && !middle && !ring && pinky) {
    return { letter: 'I', confidence: 0.9 };
  }
  
  // Letter L: Thumb and index form L
  if (thumb && index && !middle && !ring && !pinky) {
    return { letter: 'L', confidence: 0.9 };
  }
  
  // Letter V: Index and middle up (victory sign)
  if (index && middle && !ring && !pinky) {
    // Check if fingers are spread
    const indexTip = landmarks[INDEX_TIP];
    const middleTip = landmarks[MIDDLE_TIP];
    const dist = Math.sqrt(
      Math.pow(indexTip.x - middleTip.x, 2) + Math.pow(indexTip.y - middleTip.y, 2)
    );
    if (dist > 0.05) {
      return { letter: 'V', confidence: 0.9 };
    }
  }
  
  // Letter W: Three fingers up (index, middle, ring)
  if (index && middle && ring && !pinky) {
    return { letter: 'W', confidence: 0.9 };
  }
  
  // Letter Y: Thumb and pinky out (like "hang loose")
  if (thumb && !index && !middle && !ring && pinky) {
    return { letter: 'Y', confidence: 0.9 };
  }
  
  // Letter H: Index and middle up, parallel (like two fingers together pointing)
  if (index && middle && !ring && !pinky) {
    const indexTip = landmarks[INDEX_TIP];
    const middleTip = landmarks[MIDDLE_TIP];
    const dist = Math.sqrt(
      Math.pow(indexTip.x - middleTip.x, 2) + Math.pow(indexTip.y - middleTip.y, 2)
    );
    // Fingers close together (parallel, not spread like V)
    if (dist < 0.05) {
      return { letter: 'H', confidence: 0.85 };
    }
  }

  // Letter J: Pinky with motion (simplified - just pinky extended, thumb may be extended)
  if (!index && !middle && !ring && pinky) {
    return { letter: 'J', confidence: 0.8 };
  }

  // Letter K: Index and middle up, thumb between them (like V with thumb in middle)
  if (index && middle && !ring && !pinky && thumb) {
    const indexTip = landmarks[INDEX_TIP];
    const middleTip = landmarks[MIDDLE_TIP];
    const thumbTip = landmarks[THUMB_TIP];
    const distIndexThumb = Math.sqrt(
      Math.pow(indexTip.x - thumbTip.x, 2) + Math.pow(indexTip.y - thumbTip.y, 2)
    );
    const distMiddleThumb = Math.sqrt(
      Math.pow(middleTip.x - thumbTip.x, 2) + Math.pow(middleTip.y - thumbTip.y, 2)
    );
    // Thumb close to both index and middle
    if (distIndexThumb < 0.08 && distMiddleThumb < 0.08) {
      return { letter: 'K', confidence: 0.85 };
    }
  }

  // Letter M: Three fingers (index, middle, ring) over thumb
  if (!index && !middle && !ring && !pinky && thumb) {
    return { letter: 'M', confidence: 0.75 };
  }

  // Letter N: Two fingers (index, middle) over thumb
  if (!index && !middle && !ring && !pinky && thumb) {
    // Check if thumb is tucked under (closer to palm)
    const thumbTip = landmarks[THUMB_TIP];
    const wrist = landmarks[WRIST];
    const thumbDist = Math.sqrt(
      Math.pow(thumbTip.x - wrist.x, 2) + Math.pow(thumbTip.y - wrist.y, 2)
    );
    if (thumbDist < 0.25) {
      return { letter: 'N', confidence: 0.75 };
    }
  }

  // Letter P: Similar to G but pointing down (index extended, thumb supporting)
  if (index && !middle && !ring && !pinky && thumb) {
    const indexTip = landmarks[INDEX_TIP];
    const indexMcp = landmarks[INDEX_MCP];
    // Pointing down (y increases downward in screen coords)
    const pointingDown = indexTip.y > indexMcp.y + 0.05;
    if (pointingDown) {
      return { letter: 'P', confidence: 0.8 };
    }
  }

  // Letter Q: Similar to G but pointing down with thumb on side
  if (index && !middle && !ring && !pinky && thumb) {
    const indexTip = landmarks[INDEX_TIP];
    const indexMcp = landmarks[INDEX_MCP];
    const pointingDown = indexTip.y > indexMcp.y + 0.05;
    if (pointingDown) {
      // Differentiate from P by thumb position (Q has thumb tucked)
      const thumbTip = landmarks[THUMB_TIP];
      const wrist = landmarks[WRIST];
      const thumbDist = Math.sqrt(
        Math.pow(thumbTip.x - wrist.x, 2) + Math.pow(thumbTip.y - wrist.y, 2)
      );
      if (thumbDist > 0.2) {
        return { letter: 'Q', confidence: 0.8 };
      }
    }
  }

  // Letter R: Crossed fingers (index and middle crossed)
  if (index && middle && !ring && !pinky && !thumb) {
    const indexTip = landmarks[INDEX_TIP];
    const middleTip = landmarks[MIDDLE_TIP];
    const indexPip = landmarks[INDEX_PIP];
    const middlePip = landmarks[MIDDLE_PIP];
    // Check if fingers are crossed (tips closer than PIPs)
    const tipDist = Math.sqrt(
      Math.pow(indexTip.x - middleTip.x, 2) + Math.pow(indexTip.y - middleTip.y, 2)
    );
    const pipDist = Math.sqrt(
      Math.pow(indexPip.x - middlePip.x, 2) + Math.pow(indexPip.y - middlePip.y, 2)
    );
    if (tipDist < pipDist) {
      return { letter: 'R', confidence: 0.85 };
    }
  }

  // Letter S: Fist with thumb over fingers (similar to A but thumb in front)
  if (!index && !middle && !ring && !pinky && thumb) {
    const thumbTip = landmarks[THUMB_TIP];
    const indexPip = landmarks[INDEX_PIP];
    const dist = Math.sqrt(
      Math.pow(thumbTip.x - indexPip.x, 2) + Math.pow(thumbTip.y - indexPip.y, 2)
    );
    // Thumb in front of fingers
    if (dist < 0.15) {
      return { letter: 'S', confidence: 0.85 };
    }
  }

  // Letter T: Similar to A but thumb between index and middle
  if (!index && !middle && !ring && !pinky && thumb) {
    const thumbTip = landmarks[THUMB_TIP];
    const indexPip = landmarks[INDEX_PIP];
    const middlePip = landmarks[MIDDLE_PIP];
    const distIndex = Math.sqrt(
      Math.pow(thumbTip.x - indexPip.x, 2) + Math.pow(thumbTip.y - indexPip.y, 2)
    );
    const distMiddle = Math.sqrt(
      Math.pow(thumbTip.x - middlePip.x, 2) + Math.pow(thumbTip.y - middlePip.y, 2)
    );
    // Thumb between index and middle
    if (distIndex < 0.12 && distMiddle < 0.12) {
      return { letter: 'T', confidence: 0.8 };
    }
  }

  // Letter U: Index and middle up together (like H but vertical)
  if (index && middle && !ring && !pinky) {
    const indexTip = landmarks[INDEX_TIP];
    const middleTip = landmarks[MIDDLE_TIP];
    const indexPip = landmarks[INDEX_PIP];
    const middlePip = landmarks[MIDDLE_PIP];
    // Both fingers pointing up (tips above PIPs)
    const indexUp = indexTip.y < indexPip.y;
    const middleUp = middleTip.y < middlePip.y;
    if (indexUp && middleUp) {
      const dist = Math.sqrt(
        Math.pow(indexTip.x - middleTip.x, 2) + Math.pow(indexTip.y - middleTip.y, 2)
      );
      if (dist < 0.06) {
        return { letter: 'U', confidence: 0.85 };
      }
    }
  }

  // Letter X: Index finger bent/hooked (only index partially extended)
  if (!index && !middle && !ring && !pinky && !thumb) {
    const indexTip = landmarks[INDEX_TIP];
    const indexPip = landmarks[INDEX_PIP];
    const indexMcp = landmarks[INDEX_MCP];
    const wrist = landmarks[WRIST];
    // Index is bent - tip is closer to wrist than pip
    const tipDist = Math.sqrt(
      Math.pow(indexTip.x - wrist.x, 2) + Math.pow(indexTip.y - wrist.y, 2)
    );
    const pipDist = Math.sqrt(
      Math.pow(indexPip.x - wrist.x, 2) + Math.pow(indexPip.y - wrist.y, 2)
    );
    const mcpDist = Math.sqrt(
      Math.pow(indexMcp.x - wrist.x, 2) + Math.pow(indexMcp.y - wrist.y, 2)
    );
    // Hooked finger: tip < pip but still extended from mcp
    if (tipDist < pipDist && tipDist > mcpDist) {
      return { letter: 'X', confidence: 0.8 };
    }
  }

  // Letter Z: Drawing Z in air (simplified - index pointing, tracing motion not detectable in static frame)
  if (index && !middle && !ring && !pinky && !thumb) {
    return { letter: 'Z', confidence: 0.7 };
  }

  // No clear match
  return { letter: null, confidence: 0 };
}

export interface DetectionResult {
  letter: string | null;
  confidence: number;
  handDetected: boolean;
}

export function useSignLanguage() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult>({
    letter: null,
    confidence: 0,
    handDetected: false,
  });
  const [detectedText, setDetectedText] = useState('');
  const [rawDebug, setRawDebug] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectionHistoryRef = useRef<string[]>([]);
  const lastDetectionTimeRef = useRef<number>(0);
  const handDetectedFramesRef = useRef<number>(0);
  const handLostFramesRef = useRef<number>(0);
  const isHandStableRef = useRef<boolean>(false);

  // Draw hand landmarks on canvas
  const drawLandmarks = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17],
      ];

      ctx.strokeStyle = 'hsl(190 90% 50%)';
      ctx.lineWidth = 3;

      connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        if (startPoint && endPoint) {
          ctx.beginPath();
          ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
          ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
          ctx.stroke();
        }
      });

      landmarks.forEach((landmark, index) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        
        if (index === 0) {
          ctx.fillStyle = 'hsl(280 80% 60%)';
        } else if (index <= 4) {
          ctx.fillStyle = 'hsl(0 84% 60%)';
        } else if (index <= 8) {
          ctx.fillStyle = 'hsl(120 70% 50%)';
        } else if (index <= 12) {
          ctx.fillStyle = 'hsl(60 90% 50%)';
        } else if (index <= 16) {
          ctx.fillStyle = 'hsl(30 100% 50%)';
        } else {
          ctx.fillStyle = 'hsl(190 90% 50%)';
        }
        
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }
  }, []);

  // Process detection results
  const onResults = useCallback((results: Results) => {
    drawLandmarks(results);

    // Buffer logic to prevent flickering
    const hasHands = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
    
    if (hasHands) {
      handDetectedFramesRef.current++;
      handLostFramesRef.current = 0;
    } else {
      handLostFramesRef.current++;
      handDetectedFramesRef.current = 0;
    }
    
    // Require 3 consecutive frames with hands to consider hand detected
    if (handDetectedFramesRef.current >= 3) {
      isHandStableRef.current = true;
    }
    // Allow 5 frames without hands before considering hand lost
    if (handLostFramesRef.current >= 5) {
      isHandStableRef.current = false;
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0 && isHandStableRef.current) {
      const landmarks = results.multiHandLandmarks[0];
      const { letter, confidence } = recognizeASL(landmarks);
      
      // Debug info
      const fingers = getFingerStates(landmarks);
      setRawDebug(`Fingers: T:${fingers.thumb ? 1 : 0} I:${fingers.index ? 1 : 0} M:${fingers.middle ? 1 : 0} R:${fingers.ring ? 1 : 0} P:${fingers.pinky ? 1 : 0} | Letter: ${letter || '?'}`);
      
      setDetectionResult({
        letter,
        confidence,
        handDetected: true,
      });

      const now = Date.now();
      if (letter && confidence > 0.7 && now - lastDetectionTimeRef.current > 1200) {
        detectionHistoryRef.current.push(letter);
        
        if (detectionHistoryRef.current.length > 4) {
          detectionHistoryRef.current.shift();
        }

        const recentDetections = detectionHistoryRef.current.slice(-2);
        const isStable = recentDetections.every(d => d === letter);
        
        if (isStable) {
          setDetectedText(prev => {
            if (prev.endsWith(letter)) {
              return prev;
            }
            return prev + letter;
          });
          lastDetectionTimeRef.current = now;
          detectionHistoryRef.current = [];
        }
      }
    } else if (!isHandStableRef.current) {
      setDetectionResult({
        letter: null,
        confidence: 0,
        handDetected: false,
      });
      setRawDebug(handLostFramesRef.current > 0 ? 'Hand lost...' : 'Show your hand');
    }
  }, [drawLandmarks]);

  // Process video frame
  const processFrame = useCallback(async () => {
    if (!handsRef.current || !videoRef.current) return;
    
    try {
      await handsRef.current.send({ image: videoRef.current });
    } catch (err) {
      console.error('Frame processing error:', err);
    }
    
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, []);

  // Initialize MediaPipe Hands
  const initialize = useCallback(async () => {
    if (handsRef.current) {
      await stop();
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get camera stream first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              resolve();
            };
          }
        });
      }

      // Initialize MediaPipe Hands
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // Use light model for faster detection
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(onResults);
      handsRef.current = hands;

      // Start processing frames
      animationFrameRef.current = requestAnimationFrame(processFrame);
      
      setIsInitialized(true);
    } catch (err) {
      console.error('Initialization error:', err);
      let errorMessage = 'Failed to initialize camera';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onResults, processFrame]);

  // Stop camera and cleanup
  const stop = useCallback(async () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (handsRef.current) {
      await handsRef.current.close();
      handsRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsInitialized(false);
    setDetectionResult({
      letter: null,
      confidence: 0,
      handDetected: false,
    });
  }, []);

  const clearText = useCallback(() => {
    setDetectedText('');
    detectionHistoryRef.current = [];
  }, []);

  const addSpace = useCallback(() => {
    setDetectedText(prev => prev + ' ');
  }, []);

  const backspace = useCallback(() => {
    setDetectedText(prev => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    videoRef,
    canvasRef,
    isInitialized,
    isLoading,
    error,
    detectionResult,
    detectedText,
    rawDebug,
    initialize,
    stop,
    clearText,
    addSpace,
    backspace,
  };
}
