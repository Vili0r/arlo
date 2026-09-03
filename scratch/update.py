import re

with open("components/new-complaint-form.tsx", "r") as f:
    new_form = f.read()

with open("components/complaint-edit-form.tsx", "r") as f:
    edit_form = f.read()

# I will replace the form elements and structure in new_form using edit_form as a reference

# Remove RemoveButton component definition
new_form = re.sub(r'function RemoveButton[\s\S]*?\}\n\n', '', new_form)

# Sticky bar styling
new_form = new_form.replace('sticky top-0', 'sticky -top-10')

# Form max-width and fieldset
new_form = new_form.replace('<form\n          id="new-complaint-form"\n          onSubmit={handleSubmit(onSubmit)}\n          className="min-w-0 max-w-3xl space-y-4"\n        >', 
'<form\n          id="new-complaint-form"\n          onSubmit={handleSubmit(onSubmit)}\n          className="min-w-0 max-w-5xl space-y-4"\n        >')

new_form = new_form.replace('{error && (', '<fieldset className="contents space-y-6">\n          {error && (')
new_form = new_form.replace('</form>', '</fieldset>\n        </form>')

# Update Devices section
devices_start_edit = edit_form.find('{/* ---------- Devices ---------- */}')
devices_end_edit = edit_form.find('{/* ---------- Patients ---------- */}')
devices_section_edit = edit_form[devices_start_edit:devices_end_edit]

# In new-complaint-form, the variable is `idx` instead of `index`, but wait... edit form uses `index`.
# Also the default state initialization for `appendProduct` is different between the two (new-complaint-form sets some defaults differently? No they both set the same).
# Let's just extract the inner mapping function from edit_form.

with open("components/new-complaint-form.tsx", "w") as f:
    f.write(new_form)

