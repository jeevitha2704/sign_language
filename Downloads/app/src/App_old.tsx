import { useEffect } from 'react';
import { useSignLanguage } from '@/hooks/useSignLanguage';
import { Header } from '@/sections/Header';
import { Footer } from '@/sections/Footer';
import { CameraSection } from '@/sections/CameraSection';
import { DetectionPanel } from '@/sections/DetectionPanel';
import { TextOutput } from '@/sections/TextOutput';
import { GuideSection } from '@/sections/GuideSection';
import { MotionDetectionSection } from '@/components/MotionDetectionSection';
import { Toaster } from '@/components/ui/sonner';
import { Sparkles, Zap, Shield } from 'lucide-react';

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/50">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function App() {
  const signLanguageHook = useSignLanguage();
  const { isInitialized, error, initialize } = signLanguageHook;

  // Auto-initialize on mount
  useEffect(() => {
    if (!isInitialized && !error) {
      initialize();
    }
  }, [initialize, isInitialized, error]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-center" richColors />
      
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 md:py-20 overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
          
          {/* Decorative Elements */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <div className="container relative">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Recognition</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Sign Language to{' '}
                <span className="gradient-text">Text Converter</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real-time ASL alphabet recognition powered by MediaPipe and TensorFlow.js. 
                Convert hand gestures to text instantly in your browser.
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
              <FeatureCard
                icon={Zap}
                title="Real-time Detection"
                description="Instant hand gesture recognition with 30fps processing"
              />
              <FeatureCard
                icon={Sparkles}
                title="AI Powered"
                description="Advanced machine learning for accurate sign recognition"
              />
              <FeatureCard
                icon={Shield}
                title="Privacy First"
                description="All processing happens locally in your browser"
              />
            </div>
          </div>
        </section>

        {/* Main App Section */}
        <section className="py-12">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Camera */}
              <div className="lg:col-span-2 space-y-6">
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

        {/* Motion Detection Section */}
        <section className="py-12 bg-muted/30">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">Motion Detection</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Detect dynamic gestures and movements in addition to static hand signs.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <MotionDetectionSection motionDetectionResult={signLanguageHook.motionDetectionResult} />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our app uses computer vision and machine learning to recognize ASL hand signs in real-time.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: '01',
                  title: 'Enable Camera',
                  description: 'Allow camera access to start hand tracking',
                },
                {
                  step: '02',
                  title: 'Show Hand Sign',
                  description: 'Position your hand clearly in the camera frame',
                },
                {
                  step: '03',
                  title: 'AI Recognition',
                  description: 'Our AI analyzes hand landmarks and gestures',
                },
                {
                  step: '04',
                  title: 'Get Text Output',
                  description: 'See the recognized letter appear instantly',
                },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold gradient-text">{item.step}</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
