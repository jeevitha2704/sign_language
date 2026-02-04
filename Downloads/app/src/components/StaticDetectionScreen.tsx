import React, { useEffect } from 'react';
import { useSignLanguage } from '@/hooks/useSignLanguage';
import { Header } from '@/sections/Header';
import { Footer } from '@/sections/Footer';
import { CameraSection } from '@/sections/CameraSection';
import { DetectionPanel } from '@/sections/DetectionPanel';
import { TextOutput } from '@/sections/TextOutput';
import { GuideSection } from '@/sections/GuideSection';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Hand, BookOpen } from 'lucide-react';

interface StaticDetectionScreenProps {
  onBack: () => void;
}

export function StaticDetectionScreen({ onBack }: StaticDetectionScreenProps) {
  const signLanguageHook = useSignLanguage('static');

  useEffect(() => {
    // Initialize camera when component mounts
    signLanguageHook.initialize();
    
    // Cleanup when component unmounts
    return () => {
      signLanguageHook.stop();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
            <Hand className="h-4 w-4" />
            <span className="font-medium">Static Letter Detection Mode</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-8 bg-blue-600 text-white">
        <div className="container">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Static Letter Detection</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Recognize individual ASL letters and static hand signs in real-time
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-blue-700 px-4 py-2 rounded-lg">
                <Hand className="h-5 w-5" />
                <span>All 26 Letters (A-Z)</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-700 px-4 py-2 rounded-lg">
                <BookOpen className="h-5 w-5" />
                <span>Visual Guide Included</span>
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
              <TextOutput hookState={signLanguageHook} />
            </div>

            {/* Right Column - Detection & Guide */}
            <div className="space-y-6">
              <DetectionPanel hookState={signLanguageHook} />
              <GuideSection />
            </div>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="py-8 bg-blue-50 border-y border-blue-200">
        <div className="container">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How to Use Static Detection</h2>
            <p className="text-gray-600">Follow these tips for best results</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Hand className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Position Hand Clearly</h3>
              <p className="text-sm text-gray-600">Keep your hand in front of the camera with good lighting</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Hold Steady</h3>
              <p className="text-sm text-gray-600">Keep your hand steady for 1-2 seconds for accurate detection</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📖</span>
              </div>
              <h3 className="font-semibold mb-2">Use the Guide</h3>
              <p className="text-sm text-gray-600">Reference the guide for correct hand positions</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <Toaster />
    </div>
  );
}
