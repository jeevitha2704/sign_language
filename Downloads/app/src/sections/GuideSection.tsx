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
  { letter: 'F', description: 'Thumb and index touch (OK sign)', difficulty: 'Medium' },
  { letter: 'G', description: 'Index pointing sideways', difficulty: 'Medium' },
  { letter: 'H', description: 'Index and middle parallel', difficulty: 'Medium' },
  { letter: 'I', description: 'Pinky finger extended', difficulty: 'Easy' },
  { letter: 'J', description: 'Pinky with motion (simplified)', difficulty: 'Hard' },
  { letter: 'K', description: 'Index and middle up, thumb between', difficulty: 'Medium' },
  { letter: 'L', description: 'L shape with thumb/index', difficulty: 'Easy' },
  { letter: 'M', description: 'Three fingers over thumb', difficulty: 'Medium' },
  { letter: 'N', description: 'Two fingers over thumb', difficulty: 'Medium' },
  { letter: 'O', description: 'O shape with fingers', difficulty: 'Medium' },
  { letter: 'P', description: 'Index pointing down', difficulty: 'Medium' },
  { letter: 'Q', description: 'Index down, thumb on side', difficulty: 'Medium' },
  { letter: 'R', description: 'Crossed fingers', difficulty: 'Hard' },
  { letter: 'S', description: 'Fist with thumb over fingers', difficulty: 'Easy' },
  { letter: 'T', description: 'Fist, thumb between fingers', difficulty: 'Medium' },
  { letter: 'U', description: 'Index and middle together', difficulty: 'Easy' },
  { letter: 'V', description: 'Victory sign', difficulty: 'Easy' },
  { letter: 'W', description: 'Three fingers up', difficulty: 'Medium' },
  { letter: 'X', description: 'Hooked index finger', difficulty: 'Medium' },
  { letter: 'Y', description: 'Thumb and pinky out', difficulty: 'Easy' },
  { letter: 'Z', description: 'Index pointing (Z motion)', difficulty: 'Hard' },
];

// Common ASL words with actual hand signs
const ASL_WORDS = [
  { 
    word: 'Hello', 
    description: 'Open hand, fingers extended, move from forehead outward (like a salute)', 
    letters: 'H-E-L-L-O', 
    difficulty: 'Easy' 
  },
  { 
    word: 'Thank You', 
    description: 'Flat hand touch chin then move forward and down (open hand)', 
    letters: 'T-H-A-N-K-Y-O-U', 
    difficulty: 'Easy' 
  },
  { 
    word: 'Yes', 
    description: 'Fist made with thumb up (S sign with thumb extended), nod up/down', 
    letters: 'Y-E-S', 
    difficulty: 'Easy' 
  },
  { 
    word: 'No', 
    description: 'Thumb between first two fingers, or flat hand with fingers together moving side to side', 
    letters: 'N-O', 
    difficulty: 'Easy' 
  },
  { 
    word: 'Please', 
    description: 'Flat hand circular motion on chest (clockwise)', 
    letters: 'P-L-E-A-S-E', 
    difficulty: 'Medium' 
  },
  { 
    word: 'Sorry', 
    description: 'Fist in S shape, circular motion on chest', 
    letters: 'S-O-R-R-Y', 
    difficulty: 'Medium' 
  },
  { 
    word: 'Help', 
    description: 'Fist on palm of other hand, lift up (A sign on flat hand)', 
    letters: 'H-E-L-P', 
    difficulty: 'Easy' 
  },
  { 
    word: 'Love', 
    description: 'Arms crossed over chest (hugging motion)', 
    letters: 'L-O-V-E', 
    difficulty: 'Medium' 
  },
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
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  return (
    <Card className="p-6 bg-card/50 border-border/50">
      <Tabs defaultValue="alphabet" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="alphabet">ASL Alphabet</TabsTrigger>
          <TabsTrigger value="tips">Tips & Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="alphabet" className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Click on a letter to see details. All 26 letters of the ASL alphabet are now supported.
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
                          : letterData.difficulty === 'Medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {letterData.difficulty}
                      </span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Common Words Section */}
          <div className="mt-8 pt-8 border-t border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Common Words</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click on a word to see details. These are actual ASL hand signs that can be recognized by the camera.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ASL_WORDS.map(({ word }) => (
                <button
                  key={word}
                  onClick={() => setSelectedWord(selectedWord === word ? null : word)}
                  className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                    selectedWord === word
                      ? 'bg-primary/20 border-primary/50 scale-105'
                      : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <span className="text-lg font-bold text-foreground">{word}</span>
                </button>
              ))}
            </div>

            {selectedWord && (
              <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-bottom-2">
                {(() => {
                  const wordData = ASL_WORDS.find(w => w.word === selectedWord);
                  return wordData ? (
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold gradient-text">{selectedWord}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">
                          {selectedWord}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {wordData.description}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Letters: {wordData.letters}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          wordData.difficulty === 'Easy' 
                            ? 'bg-green-500/20 text-green-400' 
                            : wordData.difficulty === 'Medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {wordData.difficulty}
                        </span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
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
