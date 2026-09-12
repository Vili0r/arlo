const fs = require('fs');
let content = fs.readFileSync('components/ui/dialog.tsx', 'utf8');

// Add import for createPortal
if (!content.includes('createPortal')) {
  content = content.replace(
    'import * as React from "react";',
    'import * as React from "react";\nimport { createPortal } from "react-dom";'
  );
}

// Modify DialogContent
// We need to find DialogContent and add a mounted state.
const newDialogContent = `export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, onOpenChange } = React.useContext(DialogContext);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center print:static print:block">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity print:hidden" 
        onClick={() => onOpenChange(false)} 
      />
      <div
        className={cn(
          "relative z-50 grid w-full max-w-lg max-h-[90vh] overflow-y-auto gap-4 bg-background p-6 shadow-lg sm:rounded-xl animate-in fade-in zoom-in-95 duration-200 print:static print:block print:max-w-none print:max-h-none print:overflow-visible print:p-0 print:border-none print:shadow-none print:bg-transparent",
          className
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10 print:hidden"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}`;

content = content.replace(
  /export function DialogContent\([\s\S]*?<\/div>\n    <\/div>\n  \);\n}/,
  newDialogContent
);

fs.writeFileSync('components/ui/dialog.tsx', content);
