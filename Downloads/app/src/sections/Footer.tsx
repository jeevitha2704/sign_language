import { Hand, Heart, Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-border/50 bg-background/50">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Hand className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">SignLingo</p>
              <p className="text-xs text-muted-foreground">
                Made with <Heart className="w-3 h-3 inline text-red-500" /> for accessibility
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a 
              href="#" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a 
              href="#" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </a>
            <a 
              href="#" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>

          {/* Social */}
          <div className="flex items-center gap-2">
            <a 
              href="#"
              className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a 
              href="#"
              className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by MediaPipe Hands & TensorFlow.js • Real-time ASL recognition in your browser
          </p>
        </div>
      </div>
    </footer>
  );
}
