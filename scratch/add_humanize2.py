import re

with open("components/new-complaint-form.tsx", "r") as f:
    content = f.read()

# let's add it where formatDate is defined
humanize_code = """
function humanize(value: string) {
  return (
    value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ")
  );
}
"""
content = content.replace("function formatDate(date?: Date | null) {", humanize_code + "\nfunction formatDate(date?: Date | null) {")
with open("components/new-complaint-form.tsx", "w") as f:
    f.write(content)
