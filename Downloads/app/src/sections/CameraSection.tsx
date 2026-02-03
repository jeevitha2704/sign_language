import { Camera, Loader2, Hand, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSignLanguage } from '@/hooks/useSignLanguage';

interface CameraSectionProps {
  hookState: ReturnType<typeof useSignLanguage>;
}

export function CameraSection({ hookState }: CameraSectionProps) {
  const {
    videoRef,
    canvasRef,
    isInitialized,
    isLoading,
    error,
    detectionResult,
    initialize,
    stop,
  } = hookState;

  return (
    <Card className="relative overflow-hidden bg-card/50 border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${
              isInitialized 
                ? detectionResult.handDetected 
                  ? 'bg-green-500 pulse-ring' 
                  : 'bg-yellow-500'
                : 'bg-red-500'
            }`} />
          </div>
          <h3 className="font-semibold text-foreground">Camera Feed</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {detectionResult.handDetected && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              <Hand className="w-3 h-3 mr-1" />
              Hand Detected
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={isInitialized ? stop : initialize}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isInitialized ? (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Camera Container */}
      <div className="relative aspect-video bg-background">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground mb-2">Camera Error</p>
              <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            </div>
            <Button onClick={initialize} variant="outline">
              Try Again
            </Button>
          </div>
        ) : !isInitialized ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">Click Start to enable camera</p>
          </div>
        ) : (
          <>
            {/* Video Element */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Canvas Overlay for Landmarks */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full landmark-canvas"
            />

            {/* Scan Line Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="scan-line" />
            </div>

            {/* Corner Markers */}
            <div className="absolute inset-4 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/50" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary/50" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-primary/50" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary/50" />
            </div>

            {/* Detection Status Overlay */}
            {!detectionResult.handDetected && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="text-center">
                  <Hand className="w-12 h-12 text-muted-foreground mx-auto mb-3 animate-bounce" />
                  <p className="text-lg font-medium text-foreground">Show Your Hand</p>
                  <p className="text-sm text-muted-foreground">Position your hand in the frame</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-border/50 bg-card/30">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Resolution: <span className="text-foreground">640x480</span>
            </span>
            <span className="text-muted-foreground">
              FPS: <span className="text-foreground">30</span>
            </span>
          </div>
          <span className="text-muted-foreground">
            Model: <span className="text-foreground">MediaPipe Hands</span>
          </span>
        </div>
      </div>
    </Card>
  );
}
