const TEST_DATA = {
  "resumeUrl": "https://example.com/resume.pdf",
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
  "coverLetterUrl": "https://example.com/coverletter.pdf",
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

      return true;
    } catch (e) {
      this.log(`Error filling field: ${e.message}`, 'error');
      return false;
    }
  }

  fillSelectField(field, value) {
    if (!field || !value) return false;

    try {
      const options = Array.from(field.options);
      const match = options.find(opt =>
        opt.text.toLowerCase().includes(value.toLowerCase()) ||
        opt.value.toLowerCase().includes(value.toLowerCase())
      );

      if (match) {
        field.value = match.value;
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        return true;
      }

      return false;
    } catch (e) {
      this.log(`Error filling select: ${e.message}`, 'error');
      return false;
    }
  }

  fillRadioOrCheckbox(name, value) {
    try {
      const inputs = document.querySelectorAll(`input[type="radio"][name*="${name}" i], input[type="checkbox"][name*="${name}" i]`);

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

      return false;
    } catch (e) {
      this.log(`Error filling radio/checkbox: ${e.message}`, 'error');
      return false;
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

    const phoneTypeField = this.findFieldByLabel('phone type') || this.findFieldByLabel('type');
    if (phoneTypeField && phoneTypeField.tagName === 'SELECT') {
      this.fieldsAttempted++;
      if (this.fillSelectField(phoneTypeField, this.data.phoneType)) {
        this.fieldsFilled++;
        this.log(`Filled phone type: ${this.data.phoneType}`, 'success');
      }
    }
  }

  async fillAddressInformation() {
    this.log('Filling address information...', 'info');

    const addressFields = [
      { label: 'street', value: this.data.currentAddress.street },
      { label: 'address', value: this.data.currentAddress.street },
      { label: 'city', value: this.data.currentAddress.city },
      { label: 'state', value: this.data.currentAddress.state },
      { label: 'zip', value: this.data.currentAddress.zipCode },
      { label: 'postal', value: this.data.currentAddress.zipCode },
      { label: 'country', value: this.data.currentAddress.country }
    ];

    for (const { label, value } of addressFields) {
      this.fieldsAttempted++;
      const field = this.findFieldByLabel(label);
      if (field) {
        const filled = field.tagName === 'SELECT'
          ? this.fillSelectField(field, value)
          : this.fillTextField(field, value);

        if (filled) {
          this.fieldsFilled++;
          this.log(`Filled ${label}: ${value}`, 'success');
          await this.wait(200);
        }
      }
    }
  }

  async fillCommonQuestions() {
    this.log('Filling common questions...', 'info');

    const hearAboutField = this.findFieldByLabel('hear about') ||
                           this.findFieldByLabel('how did you') ||
                           this.findFieldByLabel('source');

    if (hearAboutField) {
      this.fieldsAttempted++;
      const filled = hearAboutField.tagName === 'SELECT'
        ? this.fillSelectField(hearAboutField, this.data.commonQuestions.howDidYouHear)
        : this.fillTextField(hearAboutField, this.data.commonQuestions.howDidYouHear);

      if (filled) {
        this.fieldsFilled++;
        this.log(`Filled source: ${this.data.commonQuestions.howDidYouHear}`, 'success');
      }
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
    if (this.fillRadioOrCheckbox('disability', this.data.disabilityStatus)) {
      this.fieldsFilled++;
      this.log(`Filled disability status: ${this.data.disabilityStatus}`, 'success');
    }
  }

  async fillVeteranStatus() {
    this.log('Filling veteran status...', 'info');

    this.fieldsAttempted++;
    if (this.fillRadioOrCheckbox('veteran', this.data.veteranStatus)) {
      this.fieldsFilled++;
      this.log(`Filled veteran status: ${this.data.veteranStatus}`, 'success');
    }
  }

  async fillRelocationPreference() {
    this.log('Filling relocation preference...', 'info');

    const relocateValue = this.data.willingToRelocate ? 'yes' : 'no';
    this.fieldsAttempted++;

    if (this.fillRadioOrCheckbox('relocate', relocateValue)) {
      this.fieldsFilled++;
      this.log(`Filled relocation: ${relocateValue}`, 'success');
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

    const remoteField = this.findFieldByLabel('remote') ||
                        this.findFieldByLabel('work preference');
    if (remoteField) {
      this.fieldsAttempted++;
      const filled = remoteField.tagName === 'SELECT'
        ? this.fillSelectField(remoteField, this.data.remoteWorkPreference)
        : this.fillRadioOrCheckbox('remote', this.data.remoteWorkPreference);

      if (filled) {
        this.fieldsFilled++;
        this.log(`Filled remote preference: ${this.data.remoteWorkPreference}`, 'success');
      }
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
    }

    this.fieldsAttempted++;
    const sponsorshipValue = this.data.requireSponsorship ? 'yes' : 'no';
    if (this.fillRadioOrCheckbox('sponsor', sponsorshipValue)) {
      this.fieldsFilled++;
      this.log(`Filled sponsorship: ${sponsorshipValue}`, 'success');
    }
  }

  async clickNextButton() {
    const nextButton = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'))
      .find(btn => {
        const text = btn.textContent || btn.value || '';
        return text.toLowerCase().includes('next') ||
               text.toLowerCase().includes('continue') ||
               btn.classList.contains('next') ||
               btn.classList.contains('continue');
      });

    if (nextButton && this.isVisible(nextButton)) {
      this.log('Clicking next button...', 'info');
      nextButton.click();
      await this.wait(1000);
      return true;
    }

    return false;
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fillCurrentPage() {
    await this.fillContactInformation();
    await this.fillAddressInformation();
    await this.fillCommonQuestions();
    await this.fillDisabilityStatus();
    await this.fillVeteranStatus();
    await this.fillRelocationPreference();
    await this.fillApplicationQuestions();
    await this.fillPositionSpecificQuestions();
  }

  async start() {
    this.log('Starting autofill process...', 'info');

    await this.wait(1500);

    const maxSteps = 12;
    for (let step = 0; step < maxSteps; step++) {
      this.log(`Processing step ${step + 1}...`, 'info');

      await this.fillCurrentPage();

      await this.wait(500);

      const hasNext = await this.clickNextButton();
      if (!hasNext) {
        this.log('No more next buttons found', 'warning');
        break;
      }

      await this.wait(1500);
    }

    const successRate = this.fieldsAttempted > 0
      ? ((this.fieldsFilled / this.fieldsAttempted) * 100).toFixed(1)
      : 0;

    this.log(`Autofill complete! Filled ${this.fieldsFilled}/${this.fieldsAttempted} fields (${successRate}%)`, 'success');
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startAutofill') {
    const autofiller = new EightfoldAutofiller(TEST_DATA);
    autofiller.start();
    sendResponse({ status: 'started' });
  }
});

console.log('[PTC Autofill] Content script loaded and ready');
