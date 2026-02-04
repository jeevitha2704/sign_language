import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Hand, AlertCircle, CheckCircle } from 'lucide-react';

interface MotionDetectionResult {
  gesture: string | null;
  confidence: number;
  motionDetected: boolean;
}

interface MotionDetectionSectionProps {
  motionDetectionResult: MotionDetectionResult;
}

const MOTION_GESTURES = [
  {
    name: 'Hello',
    gesture: '👋',
    description: 'Touch forehead and move hand outward',
    handPosition: 'Open hand, fingers together, palm outward',
    meaning: 'Greeting someone',
    color: 'bg-green-100 text-green-800'
  },
  {
    name: 'Yes',
    gesture: '👍',
    description: 'Fist moves up and down (nodding motion)',
    handPosition: 'Closed fist, palm sideways or forward',
    meaning: 'Agreement or affirmation',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    name: 'No',
    gesture: '✋❌',
    description: 'Index and middle fingers tap thumb',
    handPosition: '2 fingers extended, thumb up, palm outward',
    meaning: 'Negation or refusal',
    color: 'bg-red-100 text-red-800'
  },
  {
    name: 'Thank You',
    gesture: '🙏',
    description: 'Touch chin then move hand forward',
    handPosition: 'Flat open hand, palm upward',
    meaning: 'Expressing gratitude',
    color: 'bg-purple-100 text-purple-800'
  }
];

export function MotionDetectionSection({ motionDetectionResult }: MotionDetectionSectionProps) {
  return (
    <div className="space-y-6">
      {/* Current Detection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hand className="h-5 w-5" />
            Motion Detection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {motionDetectionResult.motionDetected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Motion Detected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-500">No Motion Detected</span>
                </>
              )}
            </div>
            {motionDetectionResult.gesture && (
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {motionDetectionResult.gesture}
              </Badge>
            )}
          </div>
          {motionDetectionResult.gesture && (
            <div className="mt-2 text-sm text-gray-600">
              Confidence: {Math.round(motionDetectionResult.confidence * 100)}%
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motion Gestures Guide */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Hand className="h-5 w-5" />
          Motion Gestures Guide
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {MOTION_GESTURES.map((item) => (
            <Card key={item.name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{item.gesture}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{item.name}</h4>
                      <Badge className={item.color} variant="secondary">
                        Motion
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="text-xs text-gray-500">
                      <strong>Hand Position:</strong> {item.handPosition}
                    </div>
                    <div className="text-xs text-gray-500">
                      <strong>Meaning:</strong> {item.meaning}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Reference Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧠 Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Expression</th>
                  <th className="text-left py-2">Gesture Type</th>
                  <th className="text-left py-2">Motion Required</th>
                </tr>
              </thead>
              <tbody>
                {MOTION_GESTURES.map((item) => (
                  <tr key={item.name} className="border-b">
                    <td className="py-2 font-medium">{item.name}</td>
                    <td className="py-2">{item.gesture}</td>
                    <td className="py-2 text-gray-600">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>How to use:</strong> Make the gestures as described. The system detects
              motion patterns over time, so hold each gesture for 1-2 seconds. Detects all 4 gestures:
              Hello (wave), Thank You (downward motion), Yes (up-down motion), and No (left-right motion).
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
