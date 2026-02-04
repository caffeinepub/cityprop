import { Heart, Video } from 'lucide-react';

export default function Footer() {
  const scrollToVideo = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center text-sm">
          <button
            onClick={scrollToVideo}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-semibold text-base"
          >
            <Video className="h-5 w-5" />
            Watch how it works
          </button>
          <p className="flex items-center gap-1 text-muted-foreground">
            © 2025. Built with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> using{' '}
            <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline">
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
