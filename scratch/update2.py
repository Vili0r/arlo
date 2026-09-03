import re

with open("components/new-complaint-form.tsx", "r") as f:
    new_form = f.read()

with open("components/complaint-edit-form.tsx", "r") as f:
    edit_form = f.read()

def get_section(content, section_id):
    start_marker = f'<SectionCard\n              id="{section_id}"'
    start = content.find(start_marker)
    if start == -1:
        start_marker = f'<SectionCard\n            id="{section_id}"'
        start = content.find(start_marker)
    if start == -1:
        return None
    
    # find matching </SectionCard>
    pos = start
    depth = 0
    while pos < len(content):
        if content[pos:].startswith('<SectionCard'):
            depth += 1
            pos += 12
        elif content[pos:].startswith('</SectionCard>'):
            depth -= 1
            if depth == 0:
                pos += len('</SectionCard>')
                return content[start:pos]
            pos += 14
        else:
            pos += 1
    return None

def replace_section(content, section_id, new_section):
    old_section = get_section(content, section_id)
    if old_section:
        return content.replace(old_section, new_section)
    return content

reporter_edit = get_section(edit_form, "reporter")
devices_edit = get_section(edit_form, "devices")
patients_edit = get_section(edit_form, "patients")

# In edit_form, the reporter section has different fields (like "Reporter country" instead of "Customer country", etc.).
# Let's adjust reporter_edit to match the fields in new_form (e.g., customerType, customerName).
reporter_edit = reporter_edit.replace('label="Reporter country"', 'label="Customer country"')
# new_form also has customerType, initialReporterName, initialReporterSurname etc.
# Actually, the reporter section in edit_form already has customerName, customerType, etc. Wait, does it?
# Let's check reporter_edit.
with open("scratch/reporter_edit.txt", "w") as f:
    f.write(reporter_edit)

