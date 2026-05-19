import Link from "next/link"

export function Footer() {
  return (
    <footer className="py-12 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo & Copyright */}
          <div>
            <Link href="/" className="text-lg font-bold tracking-wider text-foreground">
              THE PADDDLER
            </Link>
            <p className="text-xs text-muted-foreground mt-2">
              © 2024 THE PADDDLER. ALL RIGHTS RESERVED.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <Link 
              href="/terms-and-conditions" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
