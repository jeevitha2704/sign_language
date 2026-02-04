import { useState, useRef, useCallback, useEffect } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { FaceMesh } from '@mediapipe/face_mesh';

// Motion detection interfaces
interface MotionFrame {
  timestamp: number;
  handCenter: { x: number; y: number };
  handShape: string;
  landmarks: any[];
  faceLandmarks?: any[];
}

interface MotionPattern {
  type: 'hello' | 'yes' | 'no' | 'thank_you' | 'please' | 'help' | 'love' | 'sorry';
  detected: boolean;
  confidence: number;
}

// Face detection state (for chin detection)
let faceDetectionState = {
  chinDetected: false,
  chinPosition: { x: 0, y: 0 } as { x: number; y: number } | null
};

// Finger indices in MediaPipe Hands landmarks
const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_MCP = 2;
const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
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
  
  // Letter E: All fingers curled into fist (0 extended including thumb) - CHECK FIRST
  if (extendedCount === 0) {
    // Additional check: make sure thumb is truly not extended (differentiates from S)
    // For E, thumb should be tucked in, not extended at all
    const thumbTip = landmarks[THUMB_TIP];
    const wrist = landmarks[WRIST];
    const indexMcp = landmarks[5];
    const thumbDist = Math.sqrt(
      Math.pow(thumbTip.x - wrist.x, 2) + Math.pow(thumbTip.y - wrist.y, 2)
    );
    const refDist = Math.sqrt(
      Math.pow(indexMcp.x - wrist.x, 2) + Math.pow(indexMcp.y - wrist.y, 2)
    );
    // For E, thumb should be much shorter than reference distance (tucked in)
    if (thumbDist < refDist * 0.7) {
      return { letter: 'E', confidence: 0.9 };
    }
  }
  
  // Letter O: Thumb and index form O, others curled - CHECK BEFORE A
  if (!index && !middle && !ring && !pinky && thumb) {
    const thumbTip = landmarks[THUMB_TIP];
    const indexTip = landmarks[INDEX_TIP];
    // Check if thumb is close to index finger area
    const dist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
    );
    if (dist < 0.12) {  // Reduced distance to avoid conflict with T
      return { letter: 'O', confidence: 0.85 };
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
    // Thumb between index and middle (closer than O)
    if (distIndex < 0.12 && distMiddle < 0.12) {
      return { letter: 'T', confidence: 0.8 };
    }
  }
  
  // Letter A: Fist, thumb on side (only thumb extended, not close to index)
  if (!index && !middle && !ring && !pinky && thumb) {
    const thumbTip = landmarks[THUMB_TIP];
    const indexTip = landmarks[INDEX_TIP];
    const dist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
    );
    // Only A if thumb is NOT close to index (O, T, and S take precedence)
    if (dist >= 0.12) {
      return { letter: 'A', confidence: 0.9 };
    }
  }
  
  // Letter B: All fingers up, palm forward
  if (index && middle && ring && pinky && !thumb) {
    return { letter: 'B', confidence: 0.9 };
  }
  
  // Letter C: Curved C shape - all fingers curved together in a C shape
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
    
    // More specific C: curved shape with fingers spread apart from thumb
    if (maxDist - minDist < 0.15 && maxDist < 0.5 && maxDist > 0.15) {
      // Additional check: fingers should be more extended than S (thumb over fingers)
      if (indexDist > 0.2 && middleDist > 0.2 && ringDist > 0.2 && pinkyDist > 0.2) {
        return { letter: 'C', confidence: 0.8 };
      }
    }
  }
  
  // Letter M: Three fingers (index, middle, ring) over thumb, pinky outside
  if (index && middle && ring && !pinky && !thumb) {
    return { letter: 'M', confidence: 0.75 };
  }
  
  // Letter S: Closed fist with thumb across front of fingers
  if (!index && !middle && !ring && !pinky && thumb) {
    return { letter: 'S', confidence: 0.85 };
  }
  
  // Letter D: Index up straight, others curled (thumb must also be curled) - CHECK BEFORE P/Q
  if (index && !middle && !ring && !pinky && !thumb) {
    const indexTip = landmarks[INDEX_TIP];
    const indexMcp = landmarks[INDEX_MCP];
    
    // Check if index is pointing straight up (vertical)
    const indexUp = indexTip.y < indexMcp.y;
    const indexStraight = Math.abs(indexTip.x - indexMcp.x) < Math.abs(indexTip.y - indexMcp.y);
    
    if (indexUp && indexStraight) {
      return { letter: 'D', confidence: 0.9 };
    }
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
  

  // Letter U: Index and middle up together (like H but vertical) - CHECK BEFORE R
  if (index && middle && !ring && !pinky && !thumb) {
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
      // U requires fingers close together (not spread like V)
      if (dist < 0.06) {
        return { letter: 'U', confidence: 0.85 };
      }
    }
  }

  // Letter R: Crossed fingers (index and middle crossed) - AFTER U
  if (index && middle && !ring && !pinky && !thumb) {
    const indexTip = landmarks[INDEX_TIP];
    const middleTip = landmarks[MIDDLE_TIP];
    const indexPip = landmarks[INDEX_PIP];
    const middlePip = landmarks[MIDDLE_PIP];
    
    // Check if fingers are crossed (tips significantly closer than PIPs)
    const tipDist = Math.sqrt(
      Math.pow(indexTip.x - middleTip.x, 2) + Math.pow(indexTip.y - middleTip.y, 2)
    );
    const pipDist = Math.sqrt(
      Math.pow(indexPip.x - middlePip.x, 2) + Math.pow(indexPip.y - middlePip.y, 2)
    );
    
    // R requires fingers to be significantly crossed AND pointing vertically (not horizontal like H)
    const indexUp = indexTip.y < indexPip.y;
    const middleUp = middleTip.y < middlePip.y;
    const indexMcp = landmarks[INDEX_MCP];
    const middleMcp = landmarks[MIDDLE_MCP];
    const indexVertical = Math.abs(indexTip.y - indexMcp.y) > Math.abs(indexTip.x - indexMcp.x);
    const middleVertical = Math.abs(middleTip.y - middleMcp.y) > Math.abs(middleTip.x - middleMcp.x);
    
    if (tipDist < pipDist * 0.8 && (!indexUp || !middleUp) && (indexVertical || middleVertical)) {
      return { letter: 'R', confidence: 0.85 };
    }
  }



  // Letter H: Index and middle up, horizontal pointing (like G but with two fingers) - CHECK BEFORE R
  if (index && middle && !ring && !pinky && !thumb) {
    const indexTip = landmarks[INDEX_TIP];
    const middleTip = landmarks[MIDDLE_TIP];
    const indexMcp = landmarks[INDEX_MCP];
    const middleMcp = landmarks[MIDDLE_MCP];
    
    // Check if fingers are pointing horizontally (like G but with two fingers)
    const indexHorizontal = Math.abs(indexTip.x - indexMcp.x) > Math.abs(indexTip.y - indexMcp.y) * 1.2;
    const middleHorizontal = Math.abs(middleTip.x - middleMcp.x) > Math.abs(middleTip.y - middleMcp.y) * 1.2;
    
    // Check if fingers are close together (parallel, not spread like V)
    const dist = Math.sqrt(
      Math.pow(indexTip.x - middleTip.x, 2) + Math.pow(indexTip.y - middleTip.y, 2)
    );
    
    // Strong horizontal check for H
    if (indexHorizontal && middleHorizontal && dist < 0.08) {
      return { letter: 'H', confidence: 0.85 };
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
  
  // Letter I: Pinky up, others curled (thumb must be down)
  if (!index && !middle && !ring && pinky && !thumb) {
    return { letter: 'I', confidence: 0.9 };
  }
  
  // Letter J: Index, pinky, and thumb up, others curled (3 fingers up)
  if (index && !middle && !ring && pinky && thumb) {
    return { letter: 'J', confidence: 0.8 };
  }
  
  // Letter L: Thumb and index form L
  if (thumb && index && !middle && !ring && !pinky) {
    return { letter: 'L', confidence: 0.9 };
  }
  
  // Letter Y: Thumb and pinky out (like "hang loose")
  if (thumb && !index && !middle && !ring && pinky) {
    return { letter: 'Y', confidence: 0.9 };
  }
  
  // Letter P: K handshape (index+middle+thumb) pointing downward
  if (index && middle && !ring && !pinky && thumb) {
    const indexTip = landmarks[INDEX_TIP];
    const indexMcp = landmarks[INDEX_MCP];
    // Pointing down (y increases downward in screen coords)
    const pointingDown = indexTip.y > indexMcp.y + 0.05;
    if (pointingDown) {
      return { letter: 'P', confidence: 0.8 };
    }
  }

  // Letter Q: G handshape (index+thumb) pointing downward
  if (index && !middle && !ring && !pinky && thumb) {
    const indexTip = landmarks[INDEX_TIP];
    const indexMcp = landmarks[INDEX_MCP];
    // Pointing down (y increases downward in screen coords)
    const pointingDown = indexTip.y > indexMcp.y + 0.05;
    if (pointingDown) {
      return { letter: 'Q', confidence: 0.8 };
    }
  }


  // Letter K: Index and middle up, thumb between them (like V with thumb in middle) - CHECK BEFORE V
  if (index && middle && !ring && !pinky && thumb) {
    // Simple check: if all three are up, it's likely K
    // The thumb position check was too strict and failing
    return { letter: 'K', confidence: 0.85 };
  }
  

  // Letter V: Index and middle up, spread (victory sign) - CHECK BEFORE N
  if (index && middle && !ring && !pinky && !thumb) {
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
  

  // Letter K: Index and middle up, thumb between them (like V with thumb in middle) - CHECK BEFORE V
  if (index && middle && !ring && !pinky && thumb) {
    // Simple check: if all three are up, it's likely K
    // The thumb position check was too strict and failing
    return { letter: 'K', confidence: 0.85 };
  }
  

  // Letter V: Index and middle up, spread (victory sign) - CHECK BEFORE N
  if (index && middle && !ring && !pinky && !thumb) {
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

  // Letter N: Two fingers (index, middle) over thumb, ring and pinky outside - AFTER V
  if (index && middle && !ring && !pinky && !thumb) {
    // Only if not U, R, H, or V
    return { letter: 'N', confidence: 0.75 };
  }
  
  // Letter W: Three fingers up (index, middle, ring)
  if (index && middle && ring && !pinky) {
    return { letter: 'W', confidence: 0.9 };
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

  // Letter Z: Drawing Z in air (simplified - index pointing diagonally) - AFTER D
  if (index && !middle && !ring && !pinky && !thumb) {
    const indexTip = landmarks[INDEX_TIP];
    const indexMcp = landmarks[INDEX_MCP];
    
    // Check if index is pointing diagonally (not straight up like D)
    const indexUp = indexTip.y < indexMcp.y;
    const indexDiagonal = Math.abs(indexTip.x - indexMcp.x) > Math.abs(indexTip.y - indexMcp.y) * 0.5;
    
    if (indexUp && indexDiagonal) {
      return { letter: 'Z', confidence: 0.7 };
    }
  }

  // No motion word detection in static mode - use motion detection screen instead
  // Common ASL Words should only be detected in motion mode
  
  // No clear match
  return { letter: null, confidence: 0 };
}

// Motion detection functions
function getHandCenter(landmarks: any[]): { x: number; y: number } {
  let x = 0, y = 0;
  for (let i = 0; i < landmarks.length; i++) {
    x += landmarks[i].x;
    y += landmarks[i].y;
  }
  return { x: x / landmarks.length, y: y / landmarks.length };
}

function detectWaveMotion(frames: MotionFrame[]): MotionPattern | null {
  if (frames.length < 8) return null;
  
  const recentFrames = frames.slice(-8);
  const handCenters = recentFrames.map(f => f.handCenter);
  
  // Check for Hello gesture: forehead to forward movement
  const startY = handCenters[0].y;
  const startX = handCenters[0].x;
  const endX = handCenters[handCenters.length - 1].x;
  
  // Hello: Start at forehead level (y < 0.4) and move forward (decreasing x) or outward
  const startedAtForehead = startY < 0.4;
  const movedForward = endX < startX - 0.05; // Moved left (forward from camera perspective)
  const movedOutward = Math.abs(endX - startX) > 0.08; // Significant horizontal movement
  
  if (startedAtForehead && (movedForward || movedOutward)) {
    return { type: 'hello', detected: true, confidence: 0.8 };
  }
  
  return null;
}

function detectThankYouMotion(frames: MotionFrame[]): MotionPattern | null {
  if (frames.length < 6) return null;
  
  const recentFrames = frames.slice(-6);
  const handCenters = recentFrames.map(f => f.handCenter);
  
  // Check for Thank You gesture: flat hand touches chin and moves forward
  const startY = handCenters[0].y;
  const startX = handCenters[0].x;
  const endX = handCenters[handCenters.length - 1].x;
  
  // Use face detection for accurate chin position
  const chinDetected = faceDetectionState.chinDetected;
  const chinPosition = faceDetectionState.chinPosition;
  
  // Check if hand is flat (open hand) - all fingers extended
  const firstFrame = recentFrames[0];
  const isFlatHand = firstFrame && firstFrame.landmarks ? 
    (() => {
      const fingers = getFingerStates(firstFrame.landmarks);
      const { thumb, index, middle, ring, pinky } = fingers;
      return thumb && index && middle && ring && pinky; // All fingers extended
    })() : false;
  
  console.log('🙏 Thank You Detection:', {
    startY: startY.toFixed(3),
    chinDetected,
    chinPosition,
    startX: startX.toFixed(3),
    endX: endX.toFixed(3),
    movedForward: endX < startX - 0.06,
    isFlatHand,
    handShape: firstFrame?.handShape
  });
  
  // Thank You: Flat hand touches chin and moves forward
  const startedAtChin = chinDetected && chinPosition && 
    Math.abs(startY - chinPosition.y) < 0.15; // Close to estimated chin position
  
  const movedForward = endX < startX - 0.06; // Forward movement threshold
  
  // Primary detection: Flat hand + chin contact + forward movement
  if (startedAtChin && movedForward && isFlatHand) {
    console.log('✅ Thank You detected: Flat hand + chin + forward movement');
    return { type: 'thank_you', detected: true, confidence: 0.9 };
  }
  
  // Secondary detection: Flat hand + forward movement from chin area
  if (isFlatHand && startY >= 0.4 && startY <= 0.7 && movedForward) {
    console.log('✅ Thank You detected: Flat hand + forward from chin area');
    return { type: 'thank_you', detected: true, confidence: 0.8 };
  }
  
  return null;
}

function detectPleaseMotion(frames: MotionFrame[]): MotionPattern | null {
  if (frames.length < 10) return null; // Require more frames for better accuracy
  
  const recentFrames = frames.slice(-10);
  const handCenters = recentFrames.map(f => f.handCenter);
  
  // Check for Please gesture: open hand on chest making circular motion
  const firstFrame = recentFrames[0];
  const isFlatHand = firstFrame && firstFrame.landmarks ? 
    (() => {
      const fingers = getFingerStates(firstFrame.landmarks);
      const { thumb, index, middle, ring, pinky } = fingers;
      return thumb && index && middle && ring && pinky; // All fingers extended
    })() : false;
  
  // Check if hand starts AND stays at chest level
  const startY = handCenters[0].y;
  const avgY = handCenters.reduce((sum, c) => sum + c.y, 0) / handCenters.length;
  const startedAtChest = startY >= 0.35 && startY <= 0.65;
  const stayedAtChest = avgY >= 0.35 && avgY <= 0.65;
  
  // Detect circular motion more strictly
  let totalAngleChange = 0;
  let directionConsistency = 0;
  
  for (let i = 1; i < handCenters.length; i++) {
    const prevAngle = Math.atan2(handCenters[i-1].y - handCenters[0].y, handCenters[i-1].x - handCenters[0].x);
    const currAngle = Math.atan2(handCenters[i].y - handCenters[0].y, handCenters[i].x - handCenters[0].x);
    let angleDiff = currAngle - prevAngle;
    
    // Normalize angle difference to [-π, π]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    totalAngleChange += Math.abs(angleDiff);
    if (Math.abs(angleDiff) > 0.1) directionConsistency++;
  }
  
  const isCircularMotion = totalAngleChange > Math.PI * 0.75 && directionConsistency >= 6; // More strict
  
  console.log('🙏 Please Detection:', {
    isFlatHand,
    startedAtChest,
    stayedAtChest,
    totalAngleChange: totalAngleChange.toFixed(2),
    directionConsistency,
    isCircularMotion,
    handShape: firstFrame?.handShape
  });
  
  if (isFlatHand && startedAtChest && stayedAtChest && isCircularMotion) {
    console.log('✅ Please detected: Flat hand + chest + consistent circular motion');
    return { type: 'please', detected: true, confidence: 0.85 };
  }
  
  return null;
}

function detectHelpMotion(frames: MotionFrame[]): MotionPattern | null {
  if (frames.length < 6) return null;
  
  const recentFrames = frames.slice(-6);
  const handCenters = recentFrames.map(f => f.handCenter);
  
  // Check for Help gesture: flat hand up + thumb on palm + lift both hands up
  const firstFrame = recentFrames[0];
  const lastFrame = recentFrames[recentFrames.length - 1];
  
  // Check if hand starts flat (palm up) and ends higher
  const startY = handCenters[0].y;
  const endY = handCenters[handCenters.length - 1].y;
  const movedUp = endY < startY - 0.1; // Moved up significantly
  
  // For simplicity, we'll detect one flat hand moving upward
  // In a real implementation, you'd need two-hand tracking for the thumb-on-palm part
  const isFlatHand = firstFrame && firstFrame.landmarks ? 
    (() => {
      const fingers = getFingerStates(firstFrame.landmarks);
      const { thumb, index, middle, ring, pinky } = fingers;
      return thumb && index && middle && ring && pinky; // All fingers extended
    })() : false;
  
  console.log('🤝 Help Detection:', {
    isFlatHand,
    startY: startY.toFixed(3),
    endY: endY.toFixed(3),
    movedUp,
    handShape: firstFrame?.handShape
  });
  
  if (isFlatHand && movedUp) {
    console.log('✅ Help detected: Flat hand + upward movement');
    return { type: 'help', detected: true, confidence: 0.7 };
  }
  
  return null;
}

function detectLoveMotion(frames: MotionFrame[]): MotionPattern | null {
  if (frames.length < 4) return null;
  
  const recentFrames = frames.slice(-4);
  const handCenters = recentFrames.map(f => f.handCenter);
  
  // Check for Love gesture: arms crossing over chest
  // This is simplified - real implementation would need two-hand tracking
  const centerX = handCenters.reduce((sum, c) => sum + c.x, 0) / handCenters.length;
  const centerY = handCenters.reduce((sum, c) => sum + c.y, 0) / handCenters.length;
  
  // Check if hands are at chest level and crossing
  const atChestLevel = centerY >= 0.4 && centerY <= 0.7;
  
  // Detect crossing motion (hands moving toward/away from center)
  let crossingMotion = false;
  for (let i = 1; i < handCenters.length; i++) {
    const prevDist = Math.abs(handCenters[i-1].x - centerX);
    const currDist = Math.abs(handCenters[i].x - centerX);
    if (currDist < prevDist - 0.05) { // Moving toward center
      crossingMotion = true;
      break;
    }
  }
  
  console.log('❤️ Love Detection:', {
    atChestLevel,
    centerY: centerY.toFixed(3),
    crossingMotion
  });
  
  if (atChestLevel && crossingMotion) {
    console.log('✅ Love detected: Chest level + crossing motion');
    return { type: 'love', detected: true, confidence: 0.7 };
  }
  
  return null;
}

function detectSorryMotion(frames: MotionFrame[]): MotionPattern | null {
  if (frames.length < 8) return null; // Require more frames
  
  const recentFrames = frames.slice(-8);
  const handCenters = recentFrames.map(f => f.handCenter);
  
  // Check for Sorry gesture: fist + circular rubbing on chest
  const firstFrame = recentFrames[0];
  const isFist = firstFrame && firstFrame.landmarks ? 
    (() => {
      const fingers = getFingerStates(firstFrame.landmarks);
      const { thumb, index, middle, ring, pinky } = fingers;
      return thumb && !index && !middle && !ring && !pinky; // Fist: thumb extended, others closed
    })() : false;
  
  // Check if hand is at chest level (slightly different range from Please)
  const centerY = handCenters.reduce((sum, c) => sum + c.y, 0) / handCenters.length;
  const atChestLevel = centerY >= 0.4 && centerY <= 0.7; // Different from Please range
  
  // Detect circular motion (rubbing) - smaller, tighter circles than Please
  let totalAngleChange = 0;
  let smallCircularMotion = 0;
  
  for (let i = 1; i < handCenters.length; i++) {
    const prevAngle = Math.atan2(handCenters[i-1].y - centerY, handCenters[i-1].x - handCenters[0].x);
    const currAngle = Math.atan2(handCenters[i].y - centerY, handCenters[i].x - handCenters[0].x);
    let angleDiff = currAngle - prevAngle;
    
    // Normalize angle difference
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    totalAngleChange += Math.abs(angleDiff);
    if (Math.abs(angleDiff) > 0.05 && Math.abs(angleDiff) < 0.3) smallCircularMotion++;
  }
  
  // Sorry: smaller circular motion (quarter to half circle) vs Please (larger circles)
  const isCircularMotion = totalAngleChange > Math.PI / 3 && totalAngleChange < Math.PI && smallCircularMotion >= 4;
  
  console.log('😔 Sorry Detection:', {
    isFist,
    atChestLevel,
    totalAngleChange: totalAngleChange.toFixed(2),
    smallCircularMotion,
    isCircularMotion,
    handShape: firstFrame?.handShape
  });
  
  if (isFist && atChestLevel && isCircularMotion) {
    console.log('✅ Sorry detected: Fist + chest + small circular rubbing');
    return { type: 'sorry', detected: true, confidence: 0.85 };
  }
  
  return null;
}

function detectYesMotion(frames: MotionFrame[]): MotionPattern | null {
  if (frames.length < 10) return null;
  
  const recentFrames = frames.slice(-10);
  const handCenters = recentFrames.map(f => f.handCenter);
  
  // Check for Yes gesture: fist moving up and down
  let directionChanges = 0;
  let prevDirection = 0;
  let totalMovement = 0;
  
  // Check if hand is in fist position (closed hand)
  const firstFrame = recentFrames[0];
  const isFist = firstFrame && firstFrame.landmarks ? 
    (() => {
      const fingers = getFingerStates(firstFrame.landmarks);
      const { thumb, index, middle, ring, pinky } = fingers;
      // Fist: thumb extended, other fingers closed
      return thumb && !index && !middle && !ring && !pinky;
    })() : false;
  
  for (let i = 1; i < handCenters.length; i++) {
    const direction = handCenters[i].y - handCenters[i-1].y;
    totalMovement += Math.abs(direction);
    if (prevDirection !== 0 && Math.sign(direction) !== Math.sign(prevDirection)) {
      directionChanges++;
    }
    prevDirection = direction;
  }
  
  console.log('👍 Yes Detection:', {
    directionChanges,
    totalMovement: totalMovement.toFixed(3),
    isFist,
    handShape: firstFrame?.handShape,
    detected: isFist && directionChanges >= 2 && totalMovement > 0.1
  });
  
  // Only detect Yes if it's a fist with up-down movement
  if (isFist && directionChanges >= 2 && totalMovement > 0.1) {
    return { type: 'yes', detected: true, confidence: 0.8 };
  }
  
  return null;
}

function detectNoMotion(frames: MotionFrame[]): MotionPattern | null {
  if (frames.length < 3) return null;
  
  const recentFrames = frames.slice(-3);
  
  // Check for No gesture: two fingers (index and middle) tapping thumb
  // This is more of a static pose with slight tapping motion
  let detectedCount = 0;
  
  for (const frame of recentFrames) {
    const landmarks = frame.landmarks;
    
    if (landmarks) {
      const fingers = getFingerStates(landmarks);
      const { thumb, index, middle, ring, pinky } = fingers;
      
      // Debug: Log finger states
      console.log('🔍 No Detection - Finger states:', {
        thumb: thumb ? 1 : 0,
        index: index ? 1 : 0,
        middle: middle ? 1 : 0,
        ring: ring ? 1 : 0,
        pinky: pinky ? 1 : 0,
        condition: `${thumb && index && middle && !ring && !pinky}`
      });
      
      // No: Index and middle extended, thumb up, others down
      if (thumb && index && middle && !ring && !pinky) {
        detectedCount++;
        console.log('✅ No pose detected in frame');
      }
    }
  }
  
  console.log(`📊 No Detection: ${detectedCount}/${recentFrames.length} frames detected`);
  
  // Need to detect the pose in at least 2 out of 3 frames (67%)
  if (detectedCount >= 2) {
    return { type: 'no', detected: true, confidence: 0.8 };
  }
  
  return null;
}

export interface DetectionResult {
  letter: string | null;
  confidence: number;
  handDetected: boolean;
}

export interface MotionDetectionResult {
  gesture: string | null;
  confidence: number;
  motionDetected: boolean;
}

export function useSignLanguage(mode: 'static' | 'motion' = 'static') {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult>({
    letter: null,
    confidence: 0,
    handDetected: false,
  });
  const [motionDetectionResult, setMotionDetectionResult] = useState<MotionDetectionResult>({
    gesture: null,
    confidence: 0,
    motionDetected: false,
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
  
  // Motion tracking state
  const motionFramesRef = useRef<MotionFrame[]>([]);
  const lastMotionTimeRef = useRef<number>(0);
  
  // Face detection state (for chin detection)
  const faceDetectionRef = useRef<{
    chinDetected: boolean;
    chinPosition: { x: number; y: number } | null;
  }>({ chinDetected: false, chinPosition: null });
  
  // MediaPipe Face Mesh refs
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const faceResultsRef = useRef<any>(null);

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

    // Draw face landmarks and chin if detected (only in motion mode)
    if (mode === 'motion' && faceResultsRef.current && faceResultsRef.current.multiFaceLandmarks && faceResultsRef.current.multiFaceLandmarks.length > 0) {
      const faceLandmarks = faceResultsRef.current.multiFaceLandmarks[0];
      
      // MediaPipe Face Mesh connections (official connections)
      const faceConnections = [
        // Face oval
        [10, 338], [338, 297], [297, 332], [332, 284], [284, 251], [251, 389], [389, 356], [356, 454], [454, 323], [323, 361], [361, 340], [340, 346], [346, 347], [347, 348], [348, 349], [349, 350], [350, 451], [451, 452], [452, 453], [453, 464], [464, 435], [435, 410], [410, 287], [287, 273], [273, 335], [335, 321], [321, 308], [308, 324], [324, 318], [318, 402], [402, 317], [317, 14], [14, 87], [87, 178], [178, 88], [88, 95], [95, 78], [78, 191], [191, 80], [80, 81], [81, 82], [82, 13], [13, 312], [312, 311], [311, 310], [310, 415], [415, 308],
        
        // Left eye
        [362, 398], [398, 384], [384, 385], [385, 386], [386, 387], [387, 388], [388, 466], [466, 263], [263, 249], [249, 390], [390, 373], [373, 374], [374, 380], [380, 381], [381, 382], [382, 362],
        
        // Right eye
        [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 133], [133, 173], [173, 157], [157, 158], [158, 159], [159, 160], [160, 161], [161, 246], [246, 33],
        
        // Left eyebrow
        [300, 293], [293, 334], [334, 296], [296, 336],
        
        // Right eyebrow
        [70, 63], [63, 105], [105, 66], [66, 107],
        
        // Nose
        [1, 2], [2, 5], [5, 4], [4, 6], [6, 168], [168, 8], [8, 9], [9, 10], [10, 151], [151, 9], [9, 10], [10, 151], [151, 175], [175, 152], [152, 148], [148, 176], [176, 149], [149, 150], [150, 136], [136, 172], [172, 58], [58, 132], [132, 93], [93, 234], [234, 127], [127, 162], [162, 21], [21, 54], [54, 103], [103, 67], [67, 109], [109, 10],
        
        // Lips outer
        [61, 84], [84, 17], [17, 314], [314, 405], [405, 291], [291, 375], [375, 321], [321, 308], [308, 324], [324, 318], [318, 402], [402, 317], [317, 14], [14, 87], [87, 178], [178, 88], [88, 95], [95, 61],
        
        // Lips inner
        [78, 191], [191, 80], [80, 81], [81, 82], [82, 13], [13, 312], [312, 311], [311, 310], [310, 415], [415, 308],
      ];
      
      // Draw face connections (like hand skeleton)
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)'; // Magenta for face
      ctx.lineWidth = 2;
      
      faceConnections.forEach(([start, end]) => {
        if (faceLandmarks[start] && faceLandmarks[end]) {
          const startX = faceLandmarks[start].x * canvas.width;
          const startY = faceLandmarks[start].y * canvas.height;
          const endX = faceLandmarks[end].x * canvas.width;
          const endY = faceLandmarks[end].y * canvas.height;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });
      
      // Draw face landmark points (like hand joints)
      ctx.fillStyle = 'rgba(255, 0, 255, 0.4)'; // Lighter magenta for points
      faceLandmarks.forEach((landmark: any) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      });
      
      // Draw chin landmark specifically (highlighted) - using correct chin index
      const chinLandmark = faceLandmarks[152]; // Correct chin landmark index
      const chinX = chinLandmark.x * canvas.width;
      const chinY = chinLandmark.y * canvas.height;
      
      // Draw chin point larger and in different color
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)'; // Green for chin
      ctx.beginPath();
      ctx.arc(chinX, chinY, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw "CHIN" label
      ctx.fillStyle = 'rgba(0, 255, 0, 1)';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('CHIN', chinX + 15, chinY - 10);
      
      // Draw chin detection circle
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(chinX, chinY, 30, 0, 2 * Math.PI);
      ctx.stroke();
      
      console.log('👤 Drawing accurate face mesh with official connections');
    }

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
    
    // Debug: Log hand detection status
    if (hasHands) {
      console.log('✋ Hand detected! Landmarks:', results.multiHandLandmarks[0].length);
    } else {
      console.log('🚫 No hands detected');
    }
    
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

    if (hasHands) {
      handDetectedFramesRef.current++;
      handLostFramesRef.current = 0;
      
      const landmarks = results.multiHandLandmarks[0];
      const { letter, confidence } = recognizeASL(landmarks);
      
      // Add motion frame for tracking
      const motionNow = Date.now();
      const handCenter = getHandCenter(landmarks);
      
      // Estimate chin position based on hand position
      const estimatedChinY = handCenter.y + 0.15; // Chin is typically below hand center
      const estimatedChinX = handCenter.x;
      
      const motionFrame: MotionFrame = {
        timestamp: motionNow,
        handCenter,
        handShape: letter || 'unknown',
        landmarks
      };
      
      // Simple chin detection based on hand position
      const isHandNearChinLevel = handCenter.y >= 0.35 && handCenter.y <= 0.55;
      
      // Update face detection state using actual Face Mesh results (only in motion mode)
      if (mode === 'motion' && faceResultsRef.current && faceResultsRef.current.multiFaceLandmarks && faceResultsRef.current.multiFaceLandmarks.length > 0) {
        const faceLandmarks = faceResultsRef.current.multiFaceLandmarks[0];
        // Chin landmark in MediaPipe Face Mesh is around index 152 (correct chin position)
        const chinLandmark = faceLandmarks[152];
        faceDetectionState = {
          chinDetected: true,
          chinPosition: { x: chinLandmark.x, y: chinLandmark.y }
        };
        console.log('👤 Face detected! Chin position:', faceDetectionState.chinPosition);
      } else {
        faceDetectionState = {
          chinDetected: false,
          chinPosition: null
        };
      }
      
      motionFramesRef.current.push(motionFrame);
      
      // Keep only last 20 frames (about 1 second at 20fps)
      if (motionFramesRef.current.length > 20) {
        motionFramesRef.current.shift();
      }
      
      // Check for motion patterns
      if (motionNow - lastMotionTimeRef.current > 2000) { // Check every 2 seconds
        const wavePattern = detectWaveMotion(motionFramesRef.current);
        const thankYouPattern = detectThankYouMotion(motionFramesRef.current);
        const pleasePattern = detectPleaseMotion(motionFramesRef.current);
        const helpPattern = detectHelpMotion(motionFramesRef.current);
        const lovePattern = detectLoveMotion(motionFramesRef.current);
        const sorryPattern = detectSorryMotion(motionFramesRef.current);
        const yesPattern = detectYesMotion(motionFramesRef.current);
        const noPattern = detectNoMotion(motionFramesRef.current);
        
        console.log('Motion Detection - Frames:', motionFramesRef.current.length, 
                   'Wave:', wavePattern?.detected, 
                   'ThankYou:', thankYouPattern?.detected,
                   'Please:', pleasePattern?.detected,
                   'Help:', helpPattern?.detected,
                   'Love:', lovePattern?.detected,
                   'Sorry:', sorryPattern?.detected,
                   'Yes:', yesPattern?.detected,
                   'No:', noPattern?.detected);
        
        if (wavePattern && wavePattern.detected) {
          console.log('👋 Hello detected!');
          setMotionDetectionResult({
            gesture: 'HELLO',
            confidence: wavePattern.confidence,
            motionDetected: true
          });
          lastMotionTimeRef.current = motionNow;
          motionFramesRef.current = []; // Clear frames after detection
        } else if (thankYouPattern && thankYouPattern.detected) {
          console.log('🙏 Thank You detected!');
          setMotionDetectionResult({
            gesture: 'THANK YOU',
            confidence: thankYouPattern.confidence,
            motionDetected: true
          });
          lastMotionTimeRef.current = motionNow;
          motionFramesRef.current = []; // Clear frames after detection
        } else if (pleasePattern && pleasePattern.detected) {
          console.log('🙏 Please detected!');
          setMotionDetectionResult({
            gesture: 'PLEASE',
            confidence: pleasePattern.confidence,
            motionDetected: true
          });
          lastMotionTimeRef.current = motionNow;
          motionFramesRef.current = []; // Clear frames after detection
        } else if (helpPattern && helpPattern.detected) {
          console.log('🤝 Help detected!');
          setMotionDetectionResult({
            gesture: 'HELP',
            confidence: helpPattern.confidence,
            motionDetected: true
          });
          lastMotionTimeRef.current = motionNow;
          motionFramesRef.current = []; // Clear frames after detection
        } else if (lovePattern && lovePattern.detected) {
          console.log('❤️ Love detected!');
          setMotionDetectionResult({
            gesture: 'LOVE',
            confidence: lovePattern.confidence,
            motionDetected: true
          });
          lastMotionTimeRef.current = motionNow;
          motionFramesRef.current = []; // Clear frames after detection
        } else if (sorryPattern && sorryPattern.detected && !pleasePattern?.detected) { // Mutual exclusion with Please
          console.log('😔 Sorry detected!');
          setMotionDetectionResult({
            gesture: 'SORRY',
            confidence: sorryPattern.confidence,
            motionDetected: true
          });
          lastMotionTimeRef.current = motionNow;
          motionFramesRef.current = []; // Clear frames after detection
        } else if (yesPattern && yesPattern.detected && !thankYouPattern?.detected) { // Mutual exclusion with Thank You
          console.log('👍 Yes detected!');
          setMotionDetectionResult({
            gesture: 'YES',
            confidence: yesPattern.confidence,
            motionDetected: true
          });
          lastMotionTimeRef.current = motionNow;
          motionFramesRef.current = []; // Clear frames after detection
        } else if (noPattern && noPattern.detected) {
          console.log('❌ No detected!');
          setMotionDetectionResult({
            gesture: 'NO',
            confidence: noPattern.confidence,
            motionDetected: true
          });
          lastMotionTimeRef.current = motionNow;
          motionFramesRef.current = []; // Clear frames after detection
        } else {
          // No motion detected, reset state
          setMotionDetectionResult({
            gesture: null,
            confidence: 0,
            motionDetected: false
          });
        }
      }
      
      // Debug info
      const fingers = getFingerStates(landmarks);
      setRawDebug(`Fingers: T:${fingers.thumb ? 1 : 0} I:${fingers.index ? 1 : 0} M:${fingers.middle ? 1 : 0} R:${fingers.ring ? 1 : 0} P:${fingers.pinky ? 1 : 0} | Letter: ${letter || '?'} | Motion Frames: ${motionFramesRef.current.length}`);
      
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
    if (!handsRef.current || !videoRef.current) {
      console.log('⚠️ Missing handsRef or videoRef');
      return;
    }
    
    try {
      // Process hands
      await handsRef.current.send({ image: videoRef.current });
      
      // Process face mesh only if in motion mode
      if (mode === 'motion' && faceMeshRef.current) {
        await faceMeshRef.current.send({ image: videoRef.current });
      }
    } catch (err) {
      console.error('Frame processing error:', err);
    }
    
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [mode]);

  // Initialize MediaPipe Hands
  const initialize = useCallback(async () => {
    console.log('🎬 Initializing camera...');
    if (handsRef.current) {
      console.log('🛑 Stopping existing hands...');
      await stop();
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get camera stream first
      console.log('📹 Requesting camera stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      console.log('✅ Camera stream obtained:', stream.active);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('📹 Setting video srcObject...');
        
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('📹 Video metadata loaded');
              resolve(void 0);
            };
          }
        });
        
        await videoRef.current.play();
        console.log('📹 Video playing');
      }

      console.log('🤚 Initializing MediaPipe Hands...');
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      console.log('⚙️ Setting MediaPipe options...');
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      console.log('🔗 Setting onResults callback...');
      hands.onResults(onResults);
      handsRef.current = hands;

      // Initialize Face Mesh for face detection
      console.log('👤 Initializing Face Mesh...');
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      console.log('⚙️ Setting Face Mesh options...');
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      console.log('🔗 Setting Face Mesh callback...');
      faceMesh.onResults((results) => {
        faceResultsRef.current = results;
        console.log('👤 Face detected! Face landmarks:', results.multiFaceLandmarks?.length || 0);
      });
      faceMeshRef.current = faceMesh;

      console.log('🎬 Starting frame processing...');
      animationFrameRef.current = requestAnimationFrame(processFrame);
      
      setIsInitialized(true);
      console.log('✅ Initialization complete!');
    } catch (err) {
      console.error('❌ Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize camera');
    } finally {
      setIsLoading(false);
    }
  }, [onResults, processFrame]);

  // Stop camera and cleanup
  const stop = useCallback(async () => {
    console.log('🛑 Stopping camera...');
    
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
    motionDetectionResult,
    detectedText,
    rawDebug,
    initialize,
    stop,
    clearText,
    addSpace,
    backspace,
  };
}

