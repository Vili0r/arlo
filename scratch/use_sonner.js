const fs = require('fs');

// 1. Fix layout
let layout = fs.readFileSync('app/layout.tsx', 'utf-8');
layout = layout.replace('import { Toaster } from "@/components/ui/toast";', 'import { Toaster } from "@/components/ui/sonner";');
fs.writeFileSync('app/layout.tsx', layout);

// 2. Fix edit form
let editForm = fs.readFileSync('components/investigation-edit-form.tsx', 'utf-8');
editForm = editForm.replace('import { toast } from "@/components/ui/toast";', 'import { toast } from "sonner";');
fs.writeFileSync('components/investigation-edit-form.tsx', editForm);

// 3. Fix summary form
let summaryForm = fs.readFileSync('components/investigation-summary-form.tsx', 'utf-8');
summaryForm = summaryForm.replace('import { toast } from "@/components/ui/toast";', 'import { toast } from "sonner";');
fs.writeFileSync('components/investigation-summary-form.tsx', summaryForm);

console.log('done sonner');
