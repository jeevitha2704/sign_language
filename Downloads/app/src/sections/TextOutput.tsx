import { useSignLanguage } from '@/hooks/useSignLanguage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Trash2, 
  Space, 
  Delete, 
  Copy, 
  Volume2,
  History
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TextOutputProps {
  hookState: ReturnType<typeof useSignLanguage>;
}

export function TextOutput({ hookState }: TextOutputProps) {
  const { detectedText, clearText, addSpace, backspace } = hookState;
  const [history, setHistory] = useState<string[]>([]);

  const handleCopy = () => {
    if (detectedText) {
      navigator.clipboard.writeText(detectedText);
      toast.success('Text copied to clipboard!');
    }
  };

  const handleClear = () => {
    if (detectedText) {
      setHistory(prev => [detectedText, ...prev].slice(0, 10));
    }
    clearText();
    toast.info('Text cleared');
  };

  const handleSpeak = () => {
    if (detectedText && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(detectedText);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="p-6 bg-card/50 border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Detected Text</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {detectedText.length} chars
          </Badge>
        </div>
      </div>

      {/* Text Display Area */}
      <div className="relative mb-4">
        <div className="min-h-[120px] p-4 rounded-xl bg-background border border-border/50">
          {detectedText ? (
            <p className="text-lg text-foreground leading-relaxed break-words">
              {detectedText}
              <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse" />
            </p>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              Sign language detection will appear here...
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={addSpace}
            disabled={!detectedText}
            className="flex-1"
          >
            <Space className="w-4 h-4 mr-2" />
            Space
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={backspace}
            disabled={!detectedText}
            className="flex-1"
          >
            <Delete className="w-4 h-4 mr-2" />
            Backspace
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSpeak}
            disabled={!detectedText}
            className="flex-1"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            Speak
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!detectedText}
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClear}
            disabled={!detectedText}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Recent Detections</span>
          </div>
          <div className="space-y-2 max-h-[120px] overflow-y-auto">
            {history.map((text, index) => (
              <div 
                key={index}
                className="p-2 rounded-lg bg-muted/50 text-sm text-muted-foreground truncate"
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
