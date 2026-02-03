import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Hand, Info, Lightbulb } from 'lucide-react';

// ASL Alphabet reference data
const ASL_ALPHABET = [
  { letter: 'A', description: 'Fist with thumb on side', difficulty: 'Easy' },
  { letter: 'B', description: 'Flat hand, fingers up', difficulty: 'Easy' },
  { letter: 'C', description: 'Curved hand like C shape', difficulty: 'Medium' },
  { letter: 'D', description: 'Index up, others curled', difficulty: 'Easy' },
  { letter: 'E', description: 'Fingers curled into palm', difficulty: 'Medium' },
  { letter: 'F', description: 'Thumb and index touch', difficulty: 'Medium' },
  { letter: 'G', description: 'Index pointing sideways', difficulty: 'Medium' },
  { letter: 'I', description: 'Pinky finger extended', difficulty: 'Easy' },
  { letter: 'L', description: 'L shape with thumb/index', difficulty: 'Easy' },
  { letter: 'O', description: 'O shape with fingers', difficulty: 'Medium' },
  { letter: 'V', description: 'Victory sign', difficulty: 'Easy' },
  { letter: 'W', description: 'Three fingers up', difficulty: 'Medium' },
  { letter: 'Y', description: 'Thumb and pinky out', difficulty: 'Easy' },
];

const TIPS = [
  {
    title: 'Good Lighting',
    description: 'Ensure your hand is well-lit and clearly visible to the camera.',
    icon: Lightbulb,
  },
  {
    title: 'Clear Background',
    description: 'Use a plain background for better hand detection accuracy.',
    icon: Info,
  },
  {
    title: 'Steady Position',
    description: 'Hold your hand steady for 1-2 seconds for best recognition.',
    icon: Hand,
  },
  {
    title: 'Proper Distance',
    description: 'Keep your hand 1-2 feet away from the camera.',
    icon: BookOpen,
  },
];

export function GuideSection() {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  return (
    <Card className="p-6 bg-card/50 border-border/50">
      <Tabs defaultValue="alphabet" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="alphabet">ASL Alphabet</TabsTrigger>
          <TabsTrigger value="tips">Tips & Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="alphabet" className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Click on a letter to see details. Currently supported letters are shown below.
          </p>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
            {ASL_ALPHABET.map(({ letter }) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                className={`aspect-square rounded-lg border transition-all duration-200 ${
                  selectedLetter === letter
                    ? 'bg-primary/20 border-primary/50 scale-105'
                    : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                <span className="text-2xl font-bold text-foreground">{letter}</span>
              </button>
            ))}
          </div>

          {selectedLetter && (
            <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-bottom-2">
              {(() => {
                const letterData = ASL_ALPHABET.find(l => l.letter === selectedLetter);
                return letterData ? (
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-4xl font-bold gradient-text">{selectedLetter}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        Letter {selectedLetter}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {letterData.description}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        letterData.difficulty === 'Easy' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {letterData.difficulty}
                      </span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <div className="grid gap-4">
            {TIPS.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <tip.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">{tip.title}</h4>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Note</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This app recognizes static ASL hand signs. For best results, hold each sign 
              steady for 1-2 seconds. Dynamic signs and finger spelling speed will affect 
              recognition accuracy.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
