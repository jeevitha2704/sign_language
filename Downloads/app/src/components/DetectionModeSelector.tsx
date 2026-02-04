import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hand, Activity, Camera, BookOpen, ArrowRight } from 'lucide-react';

interface DetectionMode {
  id: 'static' | 'motion';
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  color: string;
}

const DETECTION_MODES: DetectionMode[] = [
  {
    id: 'static',
    title: 'Static Letter Detection',
    description: 'Recognize individual ASL letters and static hand signs',
    icon: Hand,
    features: [
      'All 26 ASL letters (A-Z)',
      'Static hand poses',
      'Real-time recognition',
      'Letter guide with examples',
      'High accuracy detection'
    ],
    color: 'bg-blue-500'
  },
  {
    id: 'motion',
    title: 'Motion Gesture Detection',
    description: 'Detect dynamic gestures and movements',
    icon: Activity,
    features: [
      'Hello (wave gesture)',
      'Thank You (downward motion)',
      'Yes/No gestures',
      'Motion pattern analysis',
      'Dynamic recognition'
    ],
    color: 'bg-green-500'
  }
];

interface DetectionModeSelectorProps {
  selectedMode: 'static' | 'motion';
  onModeChange: (mode: 'static' | 'motion') => void;
}

export function DetectionModeSelector({ selectedMode, onModeChange }: DetectionModeSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Camera className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">ASL Recognition System</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your detection mode: Static letters or Motion gestures
          </p>
        </div>

        {/* Detection Mode Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {DETECTION_MODES.map((mode) => (
            <Card 
              key={mode.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                selectedMode === mode.id 
                  ? 'ring-4 ring-blue-500 shadow-lg transform scale-105' 
                  : 'hover:shadow-lg'
              }`}
              onClick={() => onModeChange(mode.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`w-16 h-16 rounded-full ${mode.color} flex items-center justify-center`}>
                    <mode.icon className="h-8 w-8 text-white" />
                  </div>
                  {selectedMode === mode.id && (
                    <Badge variant="default" className="bg-blue-500">
                      Selected
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{mode.title}</CardTitle>
                <p className="text-gray-600">{mode.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Features:</h4>
                  <ul className="space-y-2">
                    {mode.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  className={`w-full mt-6 ${selectedMode === mode.id ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  variant={selectedMode === mode.id ? 'default' : 'outline'}
                >
                  {selectedMode === mode.id ? 'Current Mode' : 'Select This Mode'}
                  {selectedMode !== mode.id && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Start Guide */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-700 mb-2">Static Detection</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Perfect for learning individual ASL letters. Hold each sign steady for 1-2 seconds.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Position your hand clearly in front of camera</li>
                  <li>• Keep hand steady for best recognition</li>
                  <li>• Use good lighting</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Motion Detection</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Great for common gestures and expressions. Make the full motion for detection.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Perform complete gestures (wave, etc.)</li>
                  <li>• Allow 1-2 seconds for motion analysis</li>
                  <li>• Keep hand in camera view throughout</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
