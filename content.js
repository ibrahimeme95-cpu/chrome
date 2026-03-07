const TEST_DATA = {
  "resumeUrl": "resume.pdf",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneType": "mobile",
  "phoneNumber": "5551234567",
  "commonQuestions": {
    "howDidYouHear": "LinkedIn"
  },
  "fullName": "John Michael Doe",
  "lastUpdated": "2025-01-08",
  "disabilityStatus": "No",
  "veteranStatus": "Not a Veteran",
  "willingToRelocate": true,
  "coverLetterUrl": "coverletter.pdf",
  "currentAddress": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "state": "California",
    "zipCode": "94101",
    "country": "United States"
  },
  "desiredSalary": "150000",
  "remoteWorkPreference": "hybrid",
  "authorizedToWork": true,
  "requireSponsorship": false
};

class EightfoldAutofiller {
  constructor(data) {
    this.data = data;
    this.fieldsFilled = 0;
    this.fieldsAttempted = 0;
  }

  log(message, type = 'info') {
    const prefix = '[PTC Autofill]';
    const styles = {
      info: 'color: blue',
      success: 'color: green',
      error: 'color: red',
      warning: 'color: orange'
    };
    console.log(`%c${prefix} ${message}`, styles[type] || styles.info);
  }

  findFieldByLabel(text, options = {}) {
    const selectors = [
      `input[aria-label*="${text}" i]`,
      `input[placeholder*="${text}" i]`,
      `input[name*="${text.replace(/\s+/g, '')}" i]`,
      `input[id*="${text.replace(/\s+/g, '')}" i]`,
      `textarea[aria-label*="${text}" i]`,
      `textarea[placeholder*="${text}" i]`,
      `select[aria-label*="${text}" i]`,
      `select[name*="${text.replace(/\s+/g, '')}" i]`
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && this.isVisible(element)) {
          return element;
        }
      } catch (e) {
        continue;
      }
    }

    const labels = document.querySelectorAll('label');
    for (const label of labels) {
      if (label.textContent.toLowerCase().includes(text.toLowerCase())) {
        const forAttr = label.getAttribute('for');
        if (forAttr) {
          const input = document.getElementById(forAttr);
          if (input && this.isVisible(input)) return input;
        }
        const input = label.querySelector('input, textarea, select');
        if (input && this.isVisible(input)) return input;
      }
    }

    return null;
  }

  findDropdownByLabel(text) {
    const textLower = text.toLowerCase();

    const labels = document.querySelectorAll('label');
    for (const label of labels) {
      if (label.textContent.toLowerCase().includes(textLower)) {
        const container = label.closest('div[class*="field"], div[class*="input"], div[class*="select"]') || label.parentElement;

        const selectElement = container?.querySelector('select');
        if (selectElement && this.isVisible(selectElement)) {
          return { type: 'select', element: selectElement };
        }

        const customDropdown = container?.querySelector('[role="combobox"], [role="listbox"], [class*="dropdown"], [data-testid*="select"]');
        if (customDropdown && this.isVisible(customDropdown)) {
          return { type: 'custom', element: customDropdown };
        }
      }
    }

    const customDropdown = document.querySelector(
      `[role="combobox"]:has-text("${text}"),
       [class*="dropdown"]:has-text("${text}"),
       [class*="select"]:has-text("${text}")`
    );

    const selects = document.querySelectorAll('select');
    for (const select of selects) {
      if (this.isVisible(select)) {
        const label = document.querySelector(`label[for="${select.id}"]`);
        if (label && label.textContent.toLowerCase().includes(textLower)) {
          return { type: 'select', element: select };
        }
      }
    }

    return null;
  }

  isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           element.offsetParent !== null;
  }

  fillTextField(field, value) {
    if (!field || !value) return false;

    try {
      field.focus();
      field.value = value;

      const events = ['input', 'change', 'blur'];
      events.forEach(eventType => {
        field.dispatchEvent(new Event(eventType, { bubbles: true }));
      });

      field.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: value
      }));

      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(field, value);
      }

      return true;
    } catch (e) {
      this.log(`Error filling field: ${e.message}`, 'error');
      return false;
    }
  }

  fillSelectField(field, value) {
    if (!field || !value) return false;

    try {
      if (field.tagName === 'SELECT') {
        const options = Array.from(field.options);
        let match = options.find(opt =>
          opt.text.toLowerCase().includes(value.toLowerCase()) ||
          opt.value.toLowerCase().includes(value.toLowerCase())
        );

        if (!match && options.length > 0) {
          match = options[0];
          this.log(`No exact match for "${value}", selecting first option: ${match.text}`, 'warning');
        }

        if (match) {
          field.value = match.value;
          field.dispatchEvent(new Event('change', { bubbles: true }));
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('blur', { bubbles: true }));
          return true;
        }
      }

      return false;
    } catch (e) {
      this.log(`Error filling select: ${e.message}`, 'error');
      return false;
    }
  }

  async fillCustomDropdown(dropdownElement, value) {
    try {
      this.log(`Attempting to fill custom dropdown with value: ${value}`, 'info');

      dropdownElement.click();
      await this.wait(500);

      const options = Array.from(document.querySelectorAll('[role="option"], li, div[class*="option"], div[class*="item"]'));

      let selectedOption = null;
      for (const option of options) {
        if (!this.isVisible(option)) continue;
        const text = option.textContent?.toLowerCase() || '';
        if (text.includes(value.toLowerCase())) {
          selectedOption = option;
          break;
        }
      }

      if (!selectedOption && options.length > 0) {
        selectedOption = options.find(opt => this.isVisible(opt));
        this.log(`No match found, selecting first visible option`, 'warning');
      }

      if (selectedOption) {
        selectedOption.click();
        await this.wait(300);

        dropdownElement.dispatchEvent(new Event('change', { bubbles: true }));
        dropdownElement.dispatchEvent(new Event('input', { bubbles: true }));

        return true;
      }

      return false;
    } catch (e) {
      this.log(`Error filling custom dropdown: ${e.message}`, 'error');
      return false;
    }
  }

  async fillDropdown(fieldLabel, value) {
    const dropdown = this.findDropdownByLabel(fieldLabel);

    if (!dropdown) {
      const selectField = this.findFieldByLabel(fieldLabel);
      if (selectField && selectField.tagName === 'SELECT') {
        return this.fillSelectField(selectField, value);
      }
      return false;
    }

    if (dropdown.type === 'select') {
      return this.fillSelectField(dropdown.element, value);
    } else {
      return await this.fillCustomDropdown(dropdown.element, value);
    }
  }

  fillRadioOrCheckbox(name, value) {
    try {
      const inputs = document.querySelectorAll(
        `input[type="radio"][name*="${name}" i],
         input[type="checkbox"][name*="${name}" i]`
      );

      for (const input of inputs) {
        if (!this.isVisible(input)) continue;

        const label = document.querySelector(`label[for="${input.id}"]`);
        const labelText = label ? label.textContent.toLowerCase() : '';
        const valueStr = String(value).toLowerCase();

        if (labelText.includes(valueStr) ||
            input.value.toLowerCase().includes(valueStr) ||
            (valueStr === 'true' || valueStr === 'yes') && input.type === 'checkbox') {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('click', { bubbles: true }));
          return true;
        }
      }

      const allInputs = document.querySelectorAll(`input[type="radio"], input[type="checkbox"]`);
      for (const input of allInputs) {
        if (!this.isVisible(input)) continue;
        const label = document.querySelector(`label[for="${input.id}"]`);
        const labelText = label ? label.textContent.toLowerCase() : '';

        if (labelText.length > 0) {
          const valueStr = String(value).toLowerCase();
          if (labelText.includes(valueStr) || labelText.includes('yes') && valueStr === 'yes') {
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('click', { bubbles: true }));
            return true;
          }
        }
      }

      return false;
    } catch (e) {
      this.log(`Error filling radio/checkbox: ${e.message}`, 'error');
      return false;
    }
  }

  async fillFileInput(fieldLabel, fileName) {
    try {
      this.log(`Looking for file input for: ${fieldLabel}`, 'info');

      let fileInput = null;

      const labels = document.querySelectorAll('label');
      for (const label of labels) {
        if (label.textContent.toLowerCase().includes(fieldLabel.toLowerCase())) {
          const container = label.closest('div') || label.parentElement;
          fileInput = container?.querySelector('input[type="file"]');
          if (fileInput) break;
        }
      }

      if (!fileInput) {
        fileInput = document.querySelector('input[type="file"]');
      }

      if (!fileInput) {
        this.log(`File input not found for: ${fieldLabel}`, 'warning');
        return false;
      }

      this.log(`Found file input, clicking it...`, 'info');

      const clickElement = fileInput.offsetParent ? fileInput : document.querySelector('button[class*="upload"], button[class*="file"], a[class*="upload"]');

      if (clickElement) {
        clickElement.click();
        await this.wait(1000);
      }

      this.log(`Simulating file selection: ${fileName}`, 'info');

      const dataTransfer = new DataTransfer();
      const file = new File(
        ['test file content'],
        fileName,
        { type: 'application/pdf' }
      );
      dataTransfer.items.add(file);

      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));

      await this.wait(500);
      this.log(`File input filled: ${fileName}`, 'success');
      return true;

    } catch (e) {
      this.log(`Error filling file input: ${e.message}`, 'warning');
      return false;
    }
  }

  async fillResume() {
    this.log('Filling resume upload...', 'info');
    this.fieldsAttempted++;
    if (await this.fillFileInput('resume', 'resume.pdf')) {
      this.fieldsFilled++;
    }
  }

  async fillCoverLetter() {
    this.log('Filling cover letter upload...', 'info');
    this.fieldsAttempted++;
    if (await this.fillFileInput('cover letter', 'coverletter.pdf')) {
      this.fieldsFilled++;
    }
  }

  async fillContactInformation() {
    this.log('Filling contact information...', 'info');

    const fields = [
      { label: 'first', value: this.data.firstName },
      { label: 'last', value: this.data.lastName },
      { label: 'email', value: this.data.email },
      { label: 'phone', value: this.data.phoneNumber }
    ];

    for (const { label, value } of fields) {
      this.fieldsAttempted++;
      const field = this.findFieldByLabel(label);
      if (field && this.fillTextField(field, value)) {
        this.fieldsFilled++;
        this.log(`Filled ${label}: ${value}`, 'success');
        await this.wait(200);
      }
    }

    this.fieldsAttempted++;
    if (await this.fillDropdown('phone type', this.data.phoneType)) {
      this.fieldsFilled++;
      this.log(`Filled phone type: ${this.data.phoneType}`, 'success');
      await this.wait(200);
    }
  }

  async fillAddressInformation() {
    this.log('Filling address information...', 'info');

    const addressFields = [
      { label: 'street', value: this.data.currentAddress.street },
      { label: 'address', value: this.data.currentAddress.street },
      { label: 'city', value: this.data.currentAddress.city }
    ];

    for (const { label, value } of addressFields) {
      this.fieldsAttempted++;
      const field = this.findFieldByLabel(label);
      if (field && this.fillTextField(field, value)) {
        this.fieldsFilled++;
        this.log(`Filled ${label}: ${value}`, 'success');
        await this.wait(200);
      }
    }

    this.fieldsAttempted++;
    if (await this.fillDropdown('state', this.data.currentAddress.state)) {
      this.fieldsFilled++;
      this.log(`Filled state: ${this.data.currentAddress.state}`, 'success');
      await this.wait(200);
    }

    this.fieldsAttempted++;
    const zipField = this.findFieldByLabel('zip') || this.findFieldByLabel('postal');
    if (zipField && this.fillTextField(zipField, this.data.currentAddress.zipCode)) {
      this.fieldsFilled++;
      this.log(`Filled zip code: ${this.data.currentAddress.zipCode}`, 'success');
      await this.wait(200);
    }

    this.fieldsAttempted++;
    if (await this.fillDropdown('country', this.data.currentAddress.country)) {
      this.fieldsFilled++;
      this.log(`Filled country: ${this.data.currentAddress.country}`, 'success');
      await this.wait(200);
    }
  }

  async fillCommonQuestions() {
    this.log('Filling common questions...', 'info');

    this.fieldsAttempted++;
    if (await this.fillDropdown('hear about', this.data.commonQuestions.howDidYouHear)) {
      this.fieldsFilled++;
      this.log(`Filled source: ${this.data.commonQuestions.howDidYouHear}`, 'success');
      await this.wait(200);
    }
  }

  async fillDisabilityStatus() {
    this.log('Filling disability status...', 'info');

    const fullNameField = this.findFieldByLabel('full name') || this.findFieldByLabel('name');
    if (fullNameField) {
      this.fieldsAttempted++;
      if (this.fillTextField(fullNameField, this.data.fullName)) {
        this.fieldsFilled++;
        this.log(`Filled full name: ${this.data.fullName}`, 'success');
        await this.wait(200);
      }
    }

    const dateField = this.findFieldByLabel('date');
    if (dateField) {
      this.fieldsAttempted++;
      const today = new Date().toISOString().split('T')[0];
      if (this.fillTextField(dateField, today)) {
        this.fieldsFilled++;
        this.log(`Filled date: ${today}`, 'success');
        await this.wait(200);
      }
    }

    this.fieldsAttempted++;
    if (await this.fillDropdown('disability', this.data.disabilityStatus)) {
      this.fieldsFilled++;
      this.log(`Filled disability status: ${this.data.disabilityStatus}`, 'success');
      await this.wait(200);
    }
  }

  async fillVeteranStatus() {
    this.log('Filling veteran status...', 'info');

    this.fieldsAttempted++;
    if (await this.fillDropdown('veteran', this.data.veteranStatus)) {
      this.fieldsFilled++;
      this.log(`Filled veteran status: ${this.data.veteranStatus}`, 'success');
      await this.wait(200);
    }
  }

  async fillRelocationPreference() {
    this.log('Filling relocation preference...', 'info');

    const relocateValue = this.data.willingToRelocate ? 'yes' : 'no';
    this.fieldsAttempted++;

    if (this.fillRadioOrCheckbox('relocate', relocateValue)) {
      this.fieldsFilled++;
      this.log(`Filled relocation: ${relocateValue}`, 'success');
      await this.wait(200);
    }
  }

  async fillApplicationQuestions() {
    this.log('Filling application questions...', 'info');

    const salaryField = this.findFieldByLabel('salary') ||
                        this.findFieldByLabel('compensation') ||
                        this.findFieldByLabel('expected salary');
    if (salaryField) {
      this.fieldsAttempted++;
      if (this.fillTextField(salaryField, this.data.desiredSalary)) {
        this.fieldsFilled++;
        this.log(`Filled salary: ${this.data.desiredSalary}`, 'success');
        await this.wait(200);
      }
    }

    this.fieldsAttempted++;
    if (await this.fillDropdown('remote', this.data.remoteWorkPreference)) {
      this.fieldsFilled++;
      this.log(`Filled remote preference: ${this.data.remoteWorkPreference}`, 'success');
      await this.wait(200);
    }
  }

  async fillPositionSpecificQuestions() {
    this.log('Filling position-specific questions...', 'info');

    this.fieldsAttempted++;
    const authorizedValue = this.data.authorizedToWork ? 'yes' : 'no';
    if (this.fillRadioOrCheckbox('authorized', authorizedValue) ||
        this.fillRadioOrCheckbox('legal', authorizedValue) ||
        this.fillRadioOrCheckbox('permit', authorizedValue)) {
      this.fieldsFilled++;
      this.log(`Filled work authorization: ${authorizedValue}`, 'success');
      await this.wait(200);
    }

    this.fieldsAttempted++;
    const sponsorshipValue = this.data.requireSponsorship ? 'yes' : 'no';
    if (this.fillRadioOrCheckbox('sponsor', sponsorshipValue)) {
      this.fieldsFilled++;
      this.log(`Filled sponsorship: ${sponsorshipValue}`, 'success');
      await this.wait(200);
    }
  }

  async clickNextButton() {
    const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a[role="button"]'));

    const nextButton = buttons.find(btn => {
      const text = (btn.textContent || btn.value || '').toLowerCase();
      return (text.includes('next') || text.includes('continue')) && !text.includes('cancel');
    });

    if (nextButton && this.isVisible(nextButton)) {
      this.log('Clicking next button...', 'info');
      nextButton.click();
      await this.wait(1200);
      return true;
    }

    return false;
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fillCurrentPage() {
    await this.fillResume();
    await this.fillContactInformation();
    await this.fillAddressInformation();
    await this.fillCommonQuestions();
    await this.fillDisabilityStatus();
    await this.fillVeteranStatus();
    await this.fillRelocationPreference();
    await this.fillCoverLetter();
    await this.fillApplicationQuestions();
    await this.fillPositionSpecificQuestions();
  }

  async start() {
    this.log('Starting autofill process...', 'info');
    this.log('This may take a few minutes as we navigate through all steps...', 'info');

    await this.wait(1500);

    const maxSteps = 12;
    for (let step = 0; step < maxSteps; step++) {
      this.log(`Processing step ${step + 1}/${maxSteps}...`, 'info');

      await this.fillCurrentPage();

      await this.wait(500);

      const hasNext = await this.clickNextButton();
      if (!hasNext) {
        this.log('Reached the end of the application', 'info');
        break;
      }

      await this.wait(1500);
    }

    const successRate = this.fieldsAttempted > 0
      ? ((this.fieldsFilled / this.fieldsAttempted) * 100).toFixed(1)
      : 0;

    this.log(`Autofill complete! Filled ${this.fieldsFilled}/${this.fieldsAttempted} fields (${successRate}%)`, 'success');

    if (successRate >= 80) {
      this.log('Success criteria met! (80%+ fields filled)', 'success');
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startAutofill') {
    const autofiller = new EightfoldAutofiller(TEST_DATA);
    autofiller.start().catch(err => {
      console.error('[PTC Autofill] Fatal error:', err);
    });
    sendResponse({ status: 'started' });
  }
});

console.log('[PTC Autofill] Content script loaded and ready');
