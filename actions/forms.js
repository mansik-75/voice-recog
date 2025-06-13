import { BaseAction } from "./base.js"


export class FormVoiceAction extends BaseAction {
  constructor() {
    super('form', [
      'форма', 'заполни', 'введи',
      'отправь', 'следующая форма', 'предыдущая форма',
      'ставь', 'выбери'
    ]);
    this.formManager = new FormManager();
  }

  extractParams(input) {
    return {
      action: this._detectFormAction(input),
      field: this._extractFieldName(input),
      value: this._extractValue(input),
      form: this._extractFormName(input)
    };
  }

  execute(params) {
    switch (params.action) {
      case 'fill':
        this.formManager.fillField(
          params.form, 
          params.field, 
          params.value
        );
        break;
      case 'submit':
        this.formManager.submitForm(params.form);
        break;
      case 'next':
        this.formManager.focusNextForm();
        break;
      case 'prev':
        this.formManager.focusPrevForm();
        break;
    }
  }

  _detectFormAction(input) {
    if (/отправь|подтверди/i.test(input)) return 'submit';
    if (/следующая/i.test(input)) return 'next';
    if (/предыдущая/i.test(input)) return 'prev';
    return 'fill';
  }

  _extractFieldName(input) {
    const fieldMatch = input.match(
      /(?:поле|колонка|строка)\s*(?:#|\.)?([\wа-яА-ЯёЁ-]+)/i
    );
    console.log(fieldMatch)
    return fieldMatch ? fieldMatch[1] : null;
  }

  _extractValue(input) {
    const valueMatch = input.match(
      /(?:значение|введи|напиши|данные)\s*(?:["']([^"']+)["']|(\S+))/i
    );
    console.log(valueMatch)
    return valueMatch ? (valueMatch[1] || valueMatch[2]) : null;
  }

  _extractFormName(input) {
    const formMatch = input.match(
      /(?:форма|блок)\s*(?:#|\.)?([\wа-яА-ЯёЁ-]+)/i
    );
    return formMatch ? formMatch[1] : 'current';
  }
}

class FormManager {
  constructor() {
    this.forms = FormTreeGenerator.generate();
    this.currentFormIndex = 0;
    console.log(this.forms)
  }

  fillField(formId, fieldName, value) {
    const form = this._getForm(formId);
    if (!form || !form.fields[fieldName]) {
      console.error(`Поле ${fieldName} не найдено`);
      return;
    }

    const field = form.fields[fieldName];
    switch (field.type) {
      case 'checkbox':
        field.element.checked = Boolean(value);
        break;
      case 'radio':
        const group = form.fieldGroups[fieldName];
        group.elements.forEach(el => {
          el.checked = (el.value.toLowerCase() === value);
        });
        break;
      default:
        field.element.value = value;
    }

  }

  submitForm(formId) {
    const form = this._getForm(formId);
    if (!form) return;

    form.submitButton.click();
  }

  focusNextForm() {
    this.currentFormIndex = 
      (this.currentFormIndex + 1) % Object.keys(this.forms).length;
    this._focusCurrentForm();
  }

  focusPrevForm() {
    this.currentFormIndex = 
      (this.currentFormIndex - 1 + Object.keys(this.forms).length) % 
      Object.keys(this.forms).length;
    this._focusCurrentForm();
  }

  _getForm(formId) {
    return formId === 'current' 
      ? Object.values(this.forms)[this.currentFormIndex]
      : this.forms[formId];
  }

  _focusCurrentForm() {
    const form = Object.values(this.forms)[this.currentFormIndex];
    form.formElement.scrollIntoView({ behavior: 'smooth' });
  }
}

class FormTreeGenerator {
  static generate() {
    const formTree = {};
    
    const formElements = document.querySelectorAll('form, [data-form]');
    console.log(formElements)
    
    formElements.forEach((formElement, index) => {
      const formId = this._getFormId(formElement, index);
      
      formTree[formId] = {
        selector: this._getFormSelector(formElement, formId),
        fields: this._extractFields(formElement),
        fieldGroups: this._extractFieldGroups(formElement),
        submitButton: this._findSubmitButton(formElement),
        formElement: formElement
      };
    });

    return formTree;
  }

  static _getFormId(formElement, index) {
    return formElement.id || 
           formElement.getAttribute('data-form-id') || 
           `form_${index}`;
  }

  static _getFormSelector(formElement, formId) {
    if (formElement.tagName === 'FORM') {
      return formElement.id ? `#${formElement.id}` : `form:nth-child(${Array.from(document.forms).indexOf(formElement) + 1})`;
    }
    return `[data-form="${formElement.getAttribute('data-form')}"]`;
  }

  static _extractFields(formElement) {
    const fields = {};
    
    const inputs = formElement.querySelectorAll(`
      input:not([type="submit"]):not([type="reset"]), 
      textarea, 
      select, 
      [data-field],
      [role="textbox"],
      [contenteditable="true"]
    `);

    inputs.forEach(input => {
      const fieldName = this._getFieldName(input);
      if (fieldName) {
        fields[fieldName] = {
          selector: this._getFieldSelector(input, fieldName),
          element: input,
          type: this._getFieldType(input)
        };
      }
    });

    return fields;
  }

  static _getFieldName(input) {
    return input.name.toLowerCase() || 
           input.id ||
           input.getAttribute('data-field') ||
           input.getAttribute('aria-label');
  }

  static _getFieldSelector(input, fieldName) {
    if (input.name) return `[name="${input.name}"]`;
    if (input.id) return `#${input.id}`;
    if (input.getAttribute('data-field')) return `[data-field="${input.getAttribute('data-field')}"]`;
    return `[aria-label="${fieldName}"]`;
  }

  static _getFieldType(input) {
    if (input.tagName === 'TEXTAREA') return 'textarea';
    if (input.tagName === 'SELECT') return 'select';
    if (input.getAttribute('contenteditable') === 'true') return 'rich-text';
    return input.type || 'text';
  }

  static _findSubmitButton(formElement) {
    return formElement.querySelector(`
      [type="submit"], 
      button:not([type]), 
      [role="button"][aria-pressed],
      [data-submit]
    `);
  }

  static _extractFieldGroups(formElement) {
    const groups = {};
    
    const radioGroups = {};
    formElement.querySelectorAll('input[type="radio"]').forEach(radio => {
      if (!radio.name) return;
      if (!radioGroups[radio.name]) {
        radioGroups[radio.name] = [];
      }
      radioGroups[radio.name].push(radio);
    });

    const checkboxGroups = {};
    formElement.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      const groupName = checkbox.name || checkbox.dataset.group;
      if (!groupName) return;
      if (!checkboxGroups[groupName]) {
        checkboxGroups[groupName] = [];
      }
      checkboxGroups[groupName].push(checkbox);
    });

    Object.entries({ ...radioGroups, ...checkboxGroups }).forEach(([name, elements]) => {
      groups[name] = {
        type: elements[0].type === 'radio' ? 'radio' : 'checkbox',
        elements: elements,
        selector: `[name="${name}"], [data-group="${name}"]`
      };
    });

    return groups;
  }
}
