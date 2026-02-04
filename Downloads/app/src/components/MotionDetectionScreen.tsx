import React, { useEffect } from 'react';
import { useSignLanguage } from '@/hooks/useSignLanguage';
import { Header } from '@/sections/Header';
import { Footer } from '@/sections/Footer';
import { CameraSection } from '@/sections/CameraSection';
import { MotionDetectionSection } from '@/components/MotionDetectionSection';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, Zap } from 'lucide-react';

interface MotionDetectionScreenProps {
  onBack: () => void;
}

export function MotionDetectionScreen({ onBack }: MotionDetectionScreenProps) {
  const signLanguageHook = useSignLanguage('motion');

  useEffect(() => {
    // Initialize camera when component mounts
    signLanguageHook.initialize();
    
    // Cleanup when component unmounts
    return () => {
      signLanguageHook.stop();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <Header />
      
      {/* Back Navigation */}
      <div className="container">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Mode Selection
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Activity className="h-4 w-4" />
            <span className="font-medium">Motion Gesture Detection Mode</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-8 bg-green-600 text-white">
        <div className="container">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Motion Gesture Detection</h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Detect dynamic gestures and movements in real-time
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-green-700 px-4 py-2 rounded-lg">
                <Activity className="h-5 w-5" />
                <span>Dynamic Gestures</span>
              </div>
              <div className="flex items-center gap-2 bg-green-700 px-4 py-2 rounded-lg">
                <Zap className="h-5 w-5" />
                <span>Real-time Motion Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main App Section */}
      <section className="py-12">
        <div className="container-xl max-w-7xl">
          <div className="grid xl:grid-cols-3 gap-8">
            {/* Left Column - Camera (wider) */}
            <div className="xl:col-span-2 space-y-6">
              <CameraSection hookState={signLanguageHook} />
            </div>

            {/* Right Column - Motion Detection */}
            <div className="space-y-6">
              <MotionDetectionSection motionDetectionResult={signLanguageHook.motionDetectionResult} />
            </div>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="py-8 bg-green-50 border-y border-green-200">
        <div className="container">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How to Use Motion Detection</h2>
            <p className="text-gray-600">Make complete gestures for accurate detection</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👋</span>
              </div>
              <h3 className="font-semibold mb-2">Complete Gestures</h3>
              <p className="text-sm text-gray-600">Perform the full motion (wave, etc.) for detection</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Allow Time</h3>
              <p className="text-sm text-gray-600">Give 1-2 seconds for motion analysis</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📹</span>
              </div>
              <h3 className="font-semibold mb-2">Keep in View</h3>
              <p className="text-sm text-gray-600">Keep hand in camera throughout the gesture</p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Gestures */}
      <section className="py-12">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Supported Gestures</h2>
            <p className="text-gray-600">Currently detected motion gestures</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-3xl mb-2">👋</div>
              <h3 className="font-semibold">Hello</h3>
              <p className="text-sm text-gray-600">Wave side to side</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-3xl mb-2">🙏</div>
              <h3 className="font-semibold">Thank You</h3>
              <p className="text-sm text-gray-600">Downward motion</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-semibold">Yes</h3>
              <p className="text-sm text-gray-600">Thumbs up</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-3xl mb-2">❌</div>
              <h3 className="font-semibold">No</h3>
              <p className="text-sm text-gray-600">Open palm</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <Toaster />
    </div>
  );
}
