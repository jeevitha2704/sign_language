import { useSignLanguage } from '@/hooks/useSignLanguage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Sparkles, Target, Bug } from 'lucide-react';

interface DetectionPanelProps {
  hookState: ReturnType<typeof useSignLanguage>;
}

export function DetectionPanel({ hookState }: DetectionPanelProps) {
  const { detectionResult, rawDebug } = hookState;
  const { letter, confidence, handDetected } = detectionResult;

  return (
    <Card className="p-6 bg-card/50 border-border/50">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Live Detection</h3>
      </div>

      {/* Current Letter Display */}
      <div className="relative mb-6">
        <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
          {handDetected && letter ? (
            <div className="text-center letter-pop">
              <span className="text-8xl font-bold gradient-text">{letter}</span>
              <p className="text-sm text-muted-foreground mt-2">Detected Letter</p>
            </div>
          ) : handDetected ? (
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-primary/50 mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-muted-foreground">Recognizing...</p>
            </div>
          ) : (
            <div className="text-center">
              <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No hand detected</p>
            </div>
          )}
        </div>

        {/* Confidence Badge */}
        {handDetected && letter && (
          <Badge 
            className="absolute top-3 right-3 bg-primary/20 text-primary border-primary/30"
          >
            {Math.round(confidence * 100)}% Confidence
          </Badge>
        )}
      </div>

      {/* Confidence Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Confidence</span>
          <span className="text-foreground font-medium">
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <Progress 
          value={confidence * 100} 
          className="h-2"
        />
      </div>

      {/* Status Indicators */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg border transition-colors ${
          handDetected 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-muted/50 border-border'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              handDetected ? 'bg-green-500' : 'bg-muted-foreground'
            }`} />
            <span className={`text-sm ${
              handDetected ? 'text-green-400' : 'text-muted-foreground'
            }`}>
              Hand Tracking
            </span>
          </div>
        </div>

        <div className={`p-3 rounded-lg border transition-colors ${
          letter 
            ? 'bg-primary/10 border-primary/30' 
            : 'bg-muted/50 border-border'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              letter ? 'bg-primary' : 'bg-muted-foreground'
            }`} />
            <span className={`text-sm ${
              letter ? 'text-primary' : 'text-muted-foreground'
            }`}>
              Letter Recognized
            </span>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {rawDebug && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Bug className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Debug Info</span>
          </div>
          <p className="text-xs font-mono text-muted-foreground break-all">
            {rawDebug}
          </p>
        </div>
      )}
    </Card>
  );
}
