const formValue = {}
const formErrorValue = {}

class D5InputElement extends HTMLElement { 
  constructor() { 
    super()

    this.D5Input = document.createElement('template')
    this.innerHTML = `
      <style>
      input {
        width: 100%;
        border: 1px solid #d9d9d9;
        height: 32px;
        margin-top: 5px;
        border-radius: 4px;
        text-indent: 4px;
        outline: none;
      }
      </style>

      <input />
    `
    this.D5Input.innerHTML = this.innerHTML

    const cloneContent = this.D5Input.content.cloneNode(true)
    const element = cloneContent.querySelector('input')
  
    element.addEventListener('input', (event) => { 
      formValue[this.name] = event.target.value

      // new Function(this.getAttribute('validator'))()
      formErrorValue[this.name] = this.getErrorMessage({
        required: this.getAttribute('required'),
        pattern: this.getAttribute('pattern'),
        maxLength: this.getAttribute('maxLength'),
        minLength: this.getAttribute('minLength'),
      }, formValue[this.name])

      this.updateStyle()
    })

    const shadow = this.attachShadow({mode: "open"})
    shadow.append(cloneContent)
  }

  updateStyle = () => {
    const shadow = this.shadowRoot;
    const inputElement = shadow.querySelector('input');
    const borderColor = formErrorValue[this.name] ? 'red' : '#d9d9d9';
    inputElement.style.border = `1px solid ${borderColor}`;
  }

  connectedCallback() {
    this.name = this.getAttribute('name');
  }

  getErrorMessage = (rules, value) => {
    const formatName = (name) => name.slice(0, 1).toUpperCase() + name.slice(1).toLowerCase()
    if (typeof value === 'string') {
      const trimValue = value.trim()
      if (rules?.required !== undefined && !trimValue?.length) {
        return rules.required === ''
          ? `${this.name} is a required field.` : rules.required
      }
      if (rules?.pattern) {
        const pattern = typeof rules?.pattern === 'string'
          ? {
            value: rules?.pattern,
            message: 'Please enter the correct format',
          }
          : rules?.pattern
        if (!new RegExp(pattern.value)?.test(trimValue)) {
          return pattern.message ?? 'Please enter the correct format'
        }
      }
      if (rules?.maxLength) {
        const defaultMessage = `${formatName(name)} cannot be more than ${rules?.maxLength} charactors.`
        const maxLength = typeof rules?.maxLength === 'number'
          ? {
            value: rules?.maxLength,
            message: defaultMessage,
          }
          : rules?.maxLength
        if (trimValue.length > maxLength.value) {
          return maxLength.message ?? defaultMessage
        }
      }
      if (rules?.minLength) {
        const defaultMessage = `${formatName(name)} cannot be less than ${rules?.minLength} charactors.`
        const minLength = typeof rules?.minLength === 'number'
          ? {
            value: rules?.minLength,
            message: defaultMessage,
          }
          : rules?.minLength
        if (trimValue.length < minLength.value) {
          return minLength.message ?? defaultMessage
        }
      }
      if (rules?.validator) {
        const message = rules?.validator(trimValue)
        return message ?? 'Please '
      }
    }
    if (value instanceof Array) {
      if (rules?.required && !value?.length) {
        return typeof rules.required === 'string'
          ? rules.required : `${formatName(name)} is a required field.`
      }
    }
    return ''
  }
}

customElements.define('d5-input', D5InputElement)

class D5LoginPage extends HTMLElement { 
  constructor() { 
    super()
    const LoginPage = document.createElement('template')
    LoginPage.innerHTML = `
      <style>
        .login_card {
          max-width: 360px;
          min-width: 180px;
          padding: 48px;
          background-color: #fff!important;
          margin: auto;
        }
      
        h2 {
          margin-bottom: 24px;
        }
        
        label {
          cursor: pointer;
          font-size: 12px;
        }
      
        button.login_button {
          background-color: #2852eb;
          color: white;
          height: 32px;
          width: 100%;
          outline: none;
          border: none;
          cursor: pointer;
          border-radius: 4px;
          margin: 16px 0;
          font-size: 12px;
        }
        
        .login_link {
          text-align: center;
        }
        
        .login_link_flex {
          display: flex;
          justify-content: space-between;
        }
        
        .login_link a, .login_link_flex a {
          font-size: 12px;
          text-decoration: none;
          color: #195aff;
        }
      </style>
  
      <div class="login_card">
        <h2>
          Login
        </h2>
        <label for="account">Account</label>
        <div class="input">
          <d5-input type="text" id="account" name="loginEmail" required />
        </div>
        <label for="password">Password</label>
        <div class="input">
          <d5-input type="text" id="password" name="loginPassword" />
        </div>
        <button class="login_button" onClick={D5LoginPage.onSubmit()}>
          Login
        </button>
        <div class="login_link_flex">
          <a href="#">Forgot?</a>
          <a href="#">Account does not exist? Sign Up?</a>
        </div>
      </div>
    `
  
    const cloneContent = LoginPage.content.cloneNode(true)

    const shadow = this.attachShadow({mode: "open"})
    shadow.append(cloneContent)
  }

  static onSubmit() { 
    console.log(formValue)
  }
}

customElements.define('d5-login-page', D5LoginPage)

class D5Onboarding { 
  constructor(config) { 
    this.trigger = config?.trigger || 'flat'
    this.container = config?.container
    this.route = 'login'
  }

  init() { 
    this.renderLoginPage()
  }

  setRoute = (route) => {
    this.route = route
    const page = document.getElementById('onboarding-page')
    if (page) {
      D5Onboarding.removeElement(document.querySelector('#onboarding-page'))
    }
    switch (route) {
      case 'login':
        this.renderLogin()
        break
      case 'signUp':
        this.renderSignUp()
        break
      default:
        this.renderLogin()
        break
    }
  }

  renderLoginPage() { 
    const d5LoginPage = document.createElement('d5-login-page');

    const container = document.getElementById('container');
    container.appendChild(d5LoginPage);
  }
}