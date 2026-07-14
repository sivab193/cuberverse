import { Github, Linkedin, Instagram } from 'lucide-react'

export function Footer() {
  return (
    /* In-flow, not fixed: the body is a min-h-dvh flex column, so this already
       sits at the bottom on short pages without overlapping page content. */
    <footer className="mt-auto border-t border-border/50 bg-background py-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 sm:px-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <p className="text-center text-xs text-muted-foreground sm:text-sm">
            Built for cubers, by a cuber
          </p>
          <div className="flex items-center gap-3 text-sm">
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-muted-foreground transition-colors hover:text-primary"
              href="https://siv19.dev/"
            >
              siv19.dev
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-primary"
              aria-label="GitHub"
              href="https://github.com/sivab193"
            >
              <Github className="h-[18px] w-[18px]" />
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-primary"
              aria-label="LinkedIn"
              href="https://www.linkedin.com/in/sivab193/"
            >
              <Linkedin className="h-[18px] w-[18px]" />
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-primary"
              aria-label="Instagram"
              href="https://www.instagram.com/siv19.dev/"
            >
              <Instagram className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
