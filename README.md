# AAD Nametag Generator

A browser-based tool for generating printable nametags for Cornell Alumni Affairs & Development events. Imports attendee data from CSV, allows inline editing, and exports print-ready PDFs.

---

## Overview

Each person gets two side-by-side nametags per row (3 rows per sheet = 6 people per page). The tags are designed to be peeled and folded together. Edits made to either tag are reflected in both.

---

## Workflow

### 1. Pull Registration List from iModules
Export the event registration list from iModules. Collect the **CUIDs** (Common IDs) of all registrants.

### 2. Pull Nametag Report from OBIEE
In OBIEE, navigate to **People & Relationships > Nametags**. Run the nametag report using the CUIDs from step 1. Export the results as a CSV file.

### 3. Import into the Nametag Generator
1. Open the tool in your browser
2. Create a new event (or select an existing one)
3. Upload the CSV file using the file picker
4. Review and edit nametags as needed
5. Download the PDF when ready

---

## CSV Column Headers

The tool maps CSV column headers to internal fields using a list of accepted aliases. Headers are **case-sensitive** and must match exactly (leading/trailing whitespace is trimmed automatically).

| Field | Accepted Column Headers |
|---|---|
| First Name | `Name1`, `First Name` |
| Last Name | `Name2`, `Last Name` |
| Class Year | `Yr`, `Class Tag`, `Class Year` |
| Child Tag | `Child`, `Child Tag`, `Child Tag List` |
| Advanced Degree | `USE_Advanced`, `Advanced Degree` |
| Colleges / Orgs | `Acad_Orgs`, `Colleges` |
| CUID | `ConstituentId`, `Common Id`, `CUID`, `COMMON_ID` |
| Omit Class Year | `omit_class_year`, `Omit Class Year`, `Omit Yr`, `OMIT CLASS YEAR` |

> If a column header doesn't match any alias, that field will be blank on the nametag. Check the browser console (F12) to see the raw parsed rows if something looks off.

### Omit Class Year
Set this column to `TRUE` to suppress the class year on a person's nametag. Any other value (including `FALSE` or blank) will show the year if one is present.

---

## Features

### Events
- Create multiple named events, each with their own nametag list
- Events are saved to the browser's local storage — they persist across page refreshes
- Switch between events using the dropdown
- Rename or delete events at any time

### Importing CSV
- When uploading a CSV to an event that already has nametags, you'll be prompted to **Add** (append) or **Replace** existing tags
- If adding, any person whose CUID already exists in the current list will be **updated** with the new data rather than duplicated
- People without a CUID in the CSV will always be appended as new entries

### Editing Nametags
- All fields on both the left and right nametag are editable — click directly on any field to edit
- Edits are saved when you click away (on blur)
- Changes are auto-saved to the current event in local storage

### Selecting & Filtering
- Use the checkbox on the right tag to select individual nametags
- **Select All / Deselect All** — bulk select
- **Show Selected** — filter the view to only selected nametags (useful for printing a subset)
- The filter clears automatically when all tags are deselected

### Downloading PDF
- Clicking **Download PDF** exports all currently displayed nametags as a letter-size (8.5" × 11") PDF
- If you are in "Show Selected" mode, only the selected tags will be exported
- Debug borders are automatically hidden in the PDF output

### Debug Borders
- **Show/Hide Debug Borders** toggles colored outlines around layout elements — useful for checking alignment before printing

---

## Notes for Administrators

- **Data is stored in the browser only.** Nothing is sent to a server. If you clear your browser data or use a different browser/computer, your events will be gone.
- **One browser = one data store.** Events created in Chrome won't appear in Firefox.
- If the PDF layout looks misaligned, try zooming your browser to 100% before downloading.
- The tool expects the OBIEE nametag report CSV. If you use a different export format, check that the column headers match the aliases listed above.
