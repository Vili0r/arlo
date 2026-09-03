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

# 1. Outer form
new_form = new_form.replace('<form\n          id="new-complaint-form"\n          onSubmit={handleSubmit(onSubmit)}\n          className="min-w-0 max-w-3xl space-y-4"\n        >',
'<form\n          id="new-complaint-form"\n          onSubmit={handleSubmit(onSubmit)}\n          className="min-w-0 max-w-5xl space-y-4"\n        >')

# 2. Add fieldset inside form
new_form = new_form.replace('{error && (\n            <div\n              role="alert"\n              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"\n            >\n              {error}\n            </div>\n          )}',
'{error && (\n            <div\n              role="alert"\n              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"\n            >\n              {error}\n            </div>\n          )}\n\n          <fieldset className="contents space-y-6">')

# Close fieldset
new_form = new_form.replace('</form>', '</fieldset>\n        </form>')

# 3. Replace Reporter, Devices, Patients sections
reporter_edit = get_section(edit_form, "reporter")
reporter_edit = reporter_edit.replace('label="Reporter country"', 'label="Customer country"')
# Make sure it uses CUSTOMER_TYPES properly (edit_form uses t.label/t.value which is fine)
new_form = replace_section(new_form, "reporter", reporter_edit)

devices_edit = get_section(edit_form, "devices")
# devices_edit uses `index`, which is perfectly fine since we overwrite the whole mapping function.
# Wait, let's verify if `appendProduct` matches between new and edit. 
# new: occurrence: `Device #${productFields.length + 1}`
# edit: occurrence: `Device #${productFields.length + 1}`
# It matches!
new_form = replace_section(new_form, "devices", devices_edit)

patients_edit = get_section(edit_form, "patients")
# patients_edit matches as well!
new_form = replace_section(new_form, "patients", patients_edit)

# 4. Sticky top-0 -> -top-10
new_form = new_form.replace('sticky top-0 z-20', 'sticky -top-10 z-20')

# 5. Remove RemoveButton definition
new_form = re.sub(r'function RemoveButton[\s\S]*?\}\n\n', '', new_form)

# Also fix the indentation of the replaced sections, but replacing them directly should preserve reasonable layout since edit_form is well formatted.

with open("components/new-complaint-form.tsx", "w") as f:
    f.write(new_form)

