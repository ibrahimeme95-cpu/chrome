# PTC Autofill Extension

A Chrome extension designed to automatically fill job application forms on PTC's careers website powered by Eightfold AI.

## Features

- Automatically fills multiple field types (text, select, radio, checkbox)
- Navigates through multi-step application forms
- Intelligent field detection using labels, placeholders, and attributes
- User-friendly popup interface
- Real-time progress tracking with console logs
- Handles all 10 steps of the PTC application process

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your Chrome toolbar

## Usage

1. Navigate to a PTC job application page: `https://ptc.eightfold.ai/careers/apply?pid=XXXXXX`
2. Click the extension icon in your Chrome toolbar
3. In the popup, click the "Start Autofill" button
4. The extension will automatically fill the form fields and navigate through the steps
5. Monitor progress in the browser console (Press F12 to open Developer Tools)

## Application Steps Covered

The extension handles all 10 steps of the PTC application:

1. **Resume Upload** - Automatically handled
2. **Contact Information** - First Name, Last Name, Email, Phone Type, Phone Number
3. **Source** - How did you hear about this position
4. **Disability Status** - Full Name, Date, Disability Status
5. **Veteran Status** - Veteran self-identification
6. **Relocation** - Willingness to relocate
7. **Cover Letter** - Cover letter upload
8. **Address** - Street, City, State, Postal Code, Country
9. **Application Questions** - Salary expectations, Remote work preference
10. **Position-Specific Questions** - Work authorization, Sponsorship requirements

## Data Configuration

The extension uses test data defined in `content.js`. To customize the autofill data, edit the `TEST_DATA` object in the content script:

```javascript
const TEST_DATA = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  // ... more fields
};
```

Alternatively, you can modify `test-data.json` and integrate it with the extension.

## Technical Details

- **Manifest Version**: 3
- **Permissions**: activeTab, scripting, tabs
- **Host Permissions**: https://ptc.eightfold.ai/*
- **Content Script**: Runs on PTC Eightfold AI pages
- **Background Service Worker**: Handles message passing

## Files Structure

```
├── manifest.json          # Extension configuration
├── background.js          # Service worker for message handling
├── content.js            # Main autofill logic
├── popup.html            # Extension popup interface
├── popup.js              # Popup interaction logic
├── popup.css             # Popup styling
├── test-data.json        # Sample application data
└── README.md             # This file
```

## Success Criteria

The extension aims to:
- Fill at least 80% of detected fields accurately
- Successfully navigate through all application steps
- Result in a form ready for submission (all required fields filled)

## Limitations

- File upload fields (resume, cover letter) cannot be automated due to browser security restrictions
- Some dynamically loaded fields may require page-specific adjustments
- Field detection depends on consistent HTML structure

## Development

To modify or enhance the extension:

1. Make changes to the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes on a PTC application page

## Browser Support

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers supporting Manifest V3

## License

This extension is provided for testing and evaluation purposes.
