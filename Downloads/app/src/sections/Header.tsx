import { Hand, Menu, Github, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Hand className="w-5 h-5 text-primary-foreground" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent opacity-50 blur-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">SignLingo</h1>
            <p className="text-xs text-muted-foreground">ASL to Text Converter</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Info className="w-4 h-4 mr-2" />
            About
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </Button>
        </nav>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Hand className="w-4 h-4 text-primary-foreground" />
                </div>
                SignLingo
              </SheetTitle>
              <SheetDescription>
                ASL to Text Converter
              </SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-2 mt-6">
              <Button variant="ghost" className="justify-start">
                <Info className="w-4 h-4 mr-2" />
                About
              </Button>
              <Button variant="ghost" className="justify-start">
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
