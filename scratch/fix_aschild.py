with open("components/new-complaint-form.tsx", "r") as f:
    content = f.read()

content = content.replace('<Button asChild variant="ghost" size="sm">', '<Button render={<Link href="/complaints" />} variant="ghost" size="sm">')
content = content.replace('<Link href="/complaints">Cancel</Link>', 'Cancel')

with open("components/new-complaint-form.tsx", "w") as f:
    f.write(content)
