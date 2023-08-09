const baseUrl = 'http://localhost:3000/api/v1'
let D5FormValue = {}
let D5FormErrorValue = {}
let alertMessage = ''

const setCookie = (name, value) => {
  const expirationDate = new Date()
  expirationDate.setTime(expirationDate.getTime() + 6 * 60 * 60 * 1000)
  document.cookie = `${name}=${value}; expires=${expirationDate.toUTCString()}; path=/`
}

const getCookie = (name) => {
  const cookieString = document.cookie
  const cookies = cookieString.split('; ')
  const cookie = cookies.find((item) => {
    const [cookieName] = item.split('=')
    return (cookieName.trim() === name)
  })
  const [, cookieValue] = cookie?.split('=') || ['', '']
  return cookieValue
}

const getErrorMessage = (rules, value, name) => {
  const formatName = (name) => name.slice(0, 1).toUpperCase() + name.slice(1).toLowerCase()
  if (typeof value === 'string') {
    const trimValue = value.trim()
    if (rules?.required !== undefined && !trimValue?.length) {
      return rules.required === ''
        ? `${name} is a required field.` : rules.required
    }
    if (rules?.pattern) {
      const pattern = typeof rules?.pattern === 'string'
        ? {
          value: rules?.pattern,
          message: 'Please enter the correct format',
        }
        : rules?.pattern
      if (!new RegExp(pattern.value)?.test(trimValue)) {
        return rules.patternMessage ?? 'Please enter the correct format'
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

const sendRequest = (method, url, data, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      const response = JSON.parse(xhr.responseText)
      if (!response.data) {
        callback(JSON.parse(xhr.responseText));
      } else { 
        callback(null,response)
      }
    }
  };

  xhr.send(JSON.stringify(data));
}

class D5MessageElement extends HTMLElement { 
  constructor() { 
    super()

    const D5Message = document.createElement('template')
    D5Message.innerHTML = `
      <style>
        #message-container {
          position: fixed;
          top: 20px;
          right: 20px;
        }

        .message {
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          box-shadow: rgba(49, 52, 64, 0.2) 0px 1px 6px;
          border-left: 0.25rem solid rgb(219, 54, 67);
          border-radius: 0.25rem;
          padding-right: 20px;
          margin-bottom: 16px;
          background-color: white
        }

        .message img {
          margin: 0 8px;
          width: 16px;
          height: 16px;
          margin-top: 12px;
        }

        .message p {
          font-size: 12px;
          max-width: 360px;
        }

        .message.show {
          opacity: 1;
        }

        .close {
          display: flex;
          justify-content: right;
        }

        .message span {
          transform: translateX(8px);
          cursor: pointer;
        }
      </style>

      <div id="message-container"></div>
    `

    const cloneContent = D5Message.content.cloneNode(true)

    const shadow = this.attachShadow({mode: "open"})
    shadow.append(cloneContent)
  }

  connectedCallback() { 
    if (this.showMessage) {
      this.createMessage()
    }
    this.showMessage = true
  }

  createMessage = () => {
    const displayTime = 3000;
    const messageContainer = this.shadowRoot.getElementById('message-container');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerHTML = `
      <div class="close">
        <img src='./assets/error.svg' />
        <p>${alertMessage}</p>
        <span class="close-button">&times;</span>
      </div>
    `;
    messageContainer.appendChild(messageElement);

    setTimeout(() => {
      messageElement.classList.add('show');
    }, 0);

    setTimeout(() => {
      messageElement.classList.remove('show');
      setTimeout(() => {
        messageElement.remove(); 
      }, 300); 
    }, displayTime);

    const closeButton = messageElement.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
      messageElement.classList.remove('show');
      setTimeout(() => {
        messageElement.remove(); 
      }, 300); 
    });
  }
}

customElements.define("d5-message", D5MessageElement)

class D5InputElement extends HTMLElement { 
  constructor() {
    super()
    this.D5Input = document.createElement('template')
    this.innerHTML = `
      <style>
        input {
          width: 100%;
          border: 1px solid #d9d9d9;
          height: 30px;
          margin-top: 5px;
          border-radius: 4px;
          text-indent: 4px;
          outline: none;
          font-size: 13px;
        }

        .error_message {
          font-size: 12px;
          margin-top: 2px;
          color: rgb(219, 54, 67);
        }

        .input_wrapper {
          position: relative;
        }

        .input_wrapper img {
          position: absolute;
          right: 0;
          top: 10px;
          cursor: pointer;
        }

        label {
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: rgb(49, 52, 64);
        }
      </style>

      ${this.getAttribute('label') ?
        `<label for=${this.getAttribute('id')}>${this.getAttribute('label')}</label>`
        : '<div></div>'
      }
      <div class="input_wrapper">
        <input type=${this.getAttribute('type')} id=${this.getAttribute('id')} />
        ${this.getAttribute('icon') ?
          '<img src="./assets/eye.svg" />'
          : '<div></div>'
        }
      </div>
      <div class="error_message" />
    `
    this.D5Input.innerHTML = this.innerHTML

    const cloneContent = this.D5Input.content.cloneNode(true)
    const element = cloneContent.querySelector('input')
  
    element.addEventListener('input', (event) => {
      D5FormValue[this.name] = event.target.value

      new Function(this.getAttribute('validator'))()
      D5FormErrorValue[this.name] = getErrorMessage({
        required: this.getAttribute('required'),
        pattern: this.getAttribute('pattern'),
        maxLength: Number(this.getAttribute('maxLength')),
        minLength: Number(this.getAttribute('minLength')),
        patternMessage: this.getAttribute('patternMessage'),
      }, D5FormValue[this.name], this.name)

      this.updateStyle()
    })

    const img = cloneContent.querySelector('.input_wrapper img')
    img?.addEventListener('click', () => { 
      element.setAttribute('type', element.getAttribute('type') === 'password' ? 'text' : 'password')
    })

    const shadow = this.attachShadow({mode: "open"})
    shadow.append(cloneContent)
  }

  updateStyle = () => {
    const shadow = this.shadowRoot;
    const inputElement = shadow.querySelector('input');
    const borderColor = D5FormErrorValue[this.name] ? 'rgb(219, 54, 67)' : '#d9d9d9';
    inputElement.style.border = `1px solid ${borderColor}`;

    const errorMessageElement = shadow.querySelector('.error_message')
    errorMessageElement.innerHTML = D5FormErrorValue[this.name] ?? ''
  }

  connectedCallback() {
    this.name = this.getAttribute('name');
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
        <form>
        <div class="input">
          <d5-input
            type="text"
            id="account"
            label="Account"
            name="email"
            required="Account is a required field."
            pattern="^\\S+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9._-]{2,}$"
            patternMessage="Please enter your email address."
          />
        </div>
        <div class="input">
          <d5-input
            type="password"
            id="password"
            name="password"
            label="Password"
            maxLength="16"
            minLength="6"
            required="Password is a required field."
            icon="true"
          />
        </div>
        <button
          class="login_button"
          onClick={D5LoginPage.onSubmit()}
          type="button"
        >
          Login
        </button>
        <div class="login_link_flex">
          <a href="#">Forgot?</a>
          <a href="#">Account does not exist? Sign Up?</a>
        </div>
        </form>
      </div>
    `
  
    const cloneContent = LoginPage.content.cloneNode(true)

    const shadow = this.attachShadow({mode: "open"})
    shadow.append(cloneContent)
  }

  static onSubmit = () => { 
    if (D5FormValue?.email?.trim() && D5FormValue?.password?.trim() && !D5FormErrorValue?.email && !D5FormErrorValue?.password) {
      sendRequest("POST", `${baseUrl}/onboarding/login`, D5FormValue, (error,response) => {
        if (error) {
          const customElement = document.querySelector('d5-message');
          alertMessage = error.meta.message
          customElement.createMessage();
        } else {
          setCookie('d5-onboarding-token', response.data.access)
          d5Onboarding.setRoute('content')
        }
      });
    }
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
    if (this.trigger === 'flat') {
      this.renderLoginPage()
    } else { 
      const container = document.querySelector(this.container)
      container.addEventListener('click', () => { 
        this.renderLoginPage()
      })
    }
  }

  setRoute = (route) => {
    D5FormValue = {}
    D5FormErrorValue = {}

    this.route = route
    const page = document.getElementById('onboarding-page')
    if (page) {
      this.removeElement(document.querySelector('#onboarding-page'))
    }
    switch (route) {
      case 'login':
        this.renderLogin()
        break
      case 'signUp':
        this.renderSignUp()
        break
      case 'content': 
        this.renderContent()
        break
      default:
        this.renderLogin()
        break
    }
  }

  renderLoginPage() { 
    const d5LoginPage = document.createElement('d5-login-page');
    const d5Message = document.createElement('d5-message');

    const container = document.querySelector(this.container);
    const boardingPage = document.createElement('div')
    boardingPage.id = 'onboarding-page'
    container.appendChild(boardingPage);
    container.appendChild(d5Message);
    boardingPage.appendChild(d5LoginPage)
  }

  renderContent() { 
    console.log(1)
  }

  removeElement = (element) => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element)
    }
  }
}