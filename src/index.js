const baseUrl = 'http://localhost:3000/api/v1'
let url = ''
let captcha_key = ''
let D5FormValue = {}
let D5FormErrorValue = {}
let messageValue = {}

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

const sendRequest = (method, url, data) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const response = JSON.parse(xhr.responseText);
        if (!response.data) {
          reject(JSON.parse(xhr.responseText));
        } else {
          resolve(response);
        }
      }
    };

    xhr.send(JSON.stringify(data));
  });
};

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
          border-radius: 0.25rem;
          padding-right: 20px;
          margin-bottom: 16px;
          background-color: white
        }

        .error_message{
          border-left: 0.25rem solid rgb(219, 54, 67);
        }

        .success_message {
          border-left: 0.25rem solid rgb(42, 171, 63);
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

  createMessage() {
    const displayTime = 3000;
    const messageContainer = this.shadowRoot.getElementById('message-container');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message')
    messageElement.classList.add(messageValue.type === 'error' ? 'error_message' : 'success_message');
    messageElement.innerHTML = `
      <div class="close">
        <img src=${messageValue.type === 'error' ? './assets/error.svg' : './assets/success.svg'} />
        <p>${messageValue.value}</p>
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
          position: relative;
          z-index: 4;
          border: 1px solid #d9d9d9;
          height: 30px;
          margin-top: 5px;
          border-radius: 4px;
          text-indent: 6px; 
          outline: none;
          font-size: 13px;
          padding: 0;
        }

        .border_error {
          border: 5px solid #fedbde!important;
        }

        input:focus ~ .border{
          border: 5px solid #dbe3fe;
        }

        .border {
          position: absolute;
          z-index: 3;
          bottom: -5px;
          left: -4px;
          height: 32px;
          width: 100%;
          border: 5px solid white;
          border-radius: 6px;
          transition: all 0.6s;
        }

        .error_message {
          font-size: 12px;
          margin-top: 4px;
          color: rgb(219, 54, 67);
        }

        .input_wrapper {
          position: relative;
        }

        .input_wrapper img {
          position: absolute;
          z-index: 6;
          right: 8px;
          top: 12px;
          cursor: pointer;
          width: 20px;
          height: 20px;
        }

        label {
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: rgb(49, 52, 64);
        }
      </style>

      ${this.getAttribute('label') ?
        `<label for=${this.getAttribute('id')}>${this.getAttribute('label')}${this.getAttribute('required') ? ' *': ''} </label>`
        : '<div></div>'
      }
      <div class="input_wrapper">
        <input type=${this.getAttribute('type')} id=${this.getAttribute('id')} />
        <div class="border"></div>
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

  updateStyle() {
    const shadow = this.shadowRoot;
    const inputElement = shadow.querySelector('input');
    const borderElement = shadow.querySelector('.border');
    const borderColor = D5FormErrorValue[this.name] ? 'rgb(219, 54, 67)' : '#d9d9d9';
    inputElement.style.border = `1px solid ${borderColor}`;
    borderElement.className = `border ${D5FormErrorValue[this.name] ? 'border_error' : ''}`
    inputElement.addEventListener('focus', () => { 
      borderElement.className = `border ${D5FormErrorValue[this.name] ? 'border_error' : ''}`
    })
    inputElement.addEventListener('blur', () => { 
      borderElement.className = 'border'
    })

    const errorMessageElement = shadow.querySelector('.error_message')
    errorMessageElement.innerHTML = D5FormErrorValue[this.name] ?? ''
  }

  connectedCallback() {
    this.name = this.getAttribute('name');
  }
}

customElements.define('d5-input', D5InputElement)

class D5NewInput extends HTMLElement {
  
  constructor() { 
    super()
  }

  connectedCallback() { 
    this.name = this.getAttribute('name')
    
    this.render()
  }

  render() { 
    const D5NewInput = document.createElement('template')

    D5NewInput.innerHTML = `
      <style>
        .d5_new_input {
          position: relative;
          padding-top: ${this.getAttribute('label') ? '21px' : '0'}
        }

        input {
          position: relative;
          z-index: 4;
          width: calc(100% - 36px);
          border: 1px solid #d9d9d9;
          height: 30px;
          margin-top: 5px;
          border-radius: 10px;
          text-indent: 16px; 
          outline: none;
          font-size: 13px;
          padding: 2px 0;
          padding-right: 36px;
          transition: all 0.6s;
        }

        
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0px 1000px rgba(67,118,144,0.5) inset;
        }

        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0px 1000px white inset;
          -webkit-text-fill-color: #333;
        }

        label {
          position: absolute;
          top: 4px;
          left: -6px;
          z-index: 5;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: rgb(49, 52, 64);
          transition: all 0.3s;
          background-color: white;
          padding: 0 6px;
        }

        .error_message {
          font-size: 12px;
          margin-top: 4px;
          color: rgb(219, 54, 67);
        }

        .input_wrapper img {
          position: absolute;
          right: 10px;
          top: 34px;
          cursor: pointer;
          width: 20px;
          height: 20px;
          z-index: 8
        }

        input:focus ~ label {
          left: 16px;
          top: 18px;
        }

        input:focus {
          border: 1px solid #0D52FF!important;
          padding-top: 4px;
          padding-bottom: 0px;
        }

        img {
          display: none;
        }

        .success img.success {
          display: block
        }

        .error img.error {
          display: block
        }
      </style>

      <div class="d5_new_input">
        <div class="input_wrapper">
          <input type=${this.getAttribute('type')} id=${this.getAttribute('id')} />
          ${this.getAttribute('label') ?
        `<label for=${this.getAttribute('id')}>
            ${this.getAttribute('label')}${this.getAttribute('required') ? ' *': ''} 
          </label>`
          : '<div></div>'}
          <div class="border"></div>
          <div id="img-wrapper">
            <img class="success" src="./assets/d5-new-input/success.svg" />
            <img class="error" src="./assets/d5-new-input/error.svg" />
          </div>
        </div>
        <div class="error_message" />
      </div>
    `

    const cloneContent = D5NewInput.content.cloneNode(true)

    const inputElement = cloneContent.querySelector('input')

    inputElement.addEventListener('input', (event) => {
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

    const shadow = this.attachShadow({mode: 'open'})
    shadow.append(cloneContent)
  }

  updateStyle() {
    const shadow = this.shadowRoot;
    const inputElement = shadow.querySelector('input');
    const errorMessageElement = shadow.querySelector('.error_message')
    const imgWrapper = shadow.querySelector('#img-wrapper')
    imgWrapper.className = D5FormErrorValue[this.name] ? 'error' : 'success';

    const borderColor = D5FormErrorValue[this.name] ? 'rgb(219, 54, 67)' : '#00B2A1';
    inputElement.style.border = `1px solid ${borderColor}`;
    errorMessageElement.innerHTML = D5FormErrorValue[this.name] ?? ''
  }
}

customElements.define('d5-new-input', D5NewInput)

class D5SelectElement extends HTMLElement { 
  constructor() { 
    super()
  }

  connectedCallback() { 
    this.render()
  }

  render() { 
    const D5Select = document.createElement('template')

    D5Select.innerHTML = `
      <style>
        input {
          width: 100%;
          position: relative;
          z-index: 4;
          width: 100%;
          border: 1px solid #d9d9d9;
          height: 30px;
          margin-top: 5px;
          border-radius: 4px;
          text-indent: 6px; 
          outline: none;
          font-size: 13px;
          padding: 0;
        }

        input:focus ~ .border {
          border: 5px solid #dbe3fe;
        }

        .border {
          position: absolute;
          z-index: 3;
          bottom: -5px;
          left: -4px;
          height: 32px;
          width: 100%;
          border: 5px solid white;
          border-radius: 6px;
          transition: all 0.6s;
        }

        .dropdown {
          width: 100%;
          position: relative;
          display: inline-block;
        }

        .dropdown-content {
          position: absolute;
          z-index: 99;
          display: none;
          border-radius: 0.25rem;
          box-shadow: rgba(49, 52, 64, 0.2) 0px 1px 6px;
          background-color: rgb(255, 255, 255);
          color: rgb(49, 52, 64);
          margin-top: 5px;
          max-height: 200px;
          outline: none;
          overflow-y: auto;
          padding: 0.5rem 0px;
        }

        .dropdown-content div {
          cursor: pointer;
          padding: 0.25rem 1rem;
          background-color: white;
          transition: all 0.3s;
          font-size: 13px;
        }

        .dropdown-content div:hover {
          background-color: rgb(246, 247, 252)
        }

        .input_wrapper {
          position: relative;
        }

        .input_wrapper img {
          position: absolute;
          right: 6px;
          bottom: 4px;
          z-index: 5;
        }

        .triangle_wrapper {
          cursor: pointer;
          position: absolute;
          right: 6px;
          bottom: 3px;
          z-index: 5;
          width: 24px;
          height: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 4px;
          transition: all 0.6s;
        }

        .triangle_wrapper:hover {
          background-color: rgb(240, 243, 255);
        }

        .triangle {
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid #5e637a;
        }

        .dropdown-content .option_wrapper {
          position: relative;
          padding-right: 32px;
        }

        .option_wrapper img {
          position: absolute;
          right: 6px;
          top: 9px;
          display: none;
          width: 16px;
          height: 16px;
        }

        p {
          margin: 0;
          line-height: 26px;
        }

        label {
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: rgb(49, 52, 64);
        }
      </style>

      ${this.getAttribute('label') ?
        `<label for=${this.getAttribute('id')}>${this.getAttribute('label')}${this.getAttribute('required') ? ' *': ''} </label>`
        : '<div></div>'
      }
      <div class="dropdown">
        <div class="input_wrapper">
          <input type="text" readonly="readonly">
          <div class="border"></div>
          <div class="triangle_wrapper">
            <div class="triangle"></div>
          </div>
        </div>
        <div id="dropdownContent" class="dropdown-content">
        </div>
      </div>
    `

    const cloneContent = D5Select.content.cloneNode(true)
    const dropdownContent = cloneContent.getElementById("dropdownContent");
    const dropdown = cloneContent.querySelectorAll(".dropdown")[0];
    const input = cloneContent.querySelector('input')
    const triangleWrappper = cloneContent.querySelector('.triangle_wrapper')
    
    const toggleDropdown = () => {
      dropdownContent.style.display = (dropdownContent.style.display === "" || dropdownContent.style.display === "none") ? "block" : "none";
      input.focus()
    }

    input.addEventListener('click', toggleDropdown)
    triangleWrappper.addEventListener('click', toggleDropdown)

    const shadowRoot = document.querySelector('#onboarding-page');
    shadowRoot.addEventListener('click', function (event) {
      const path = event.composedPath();
      if (!path.includes(dropdown) && dropdownContent.style.display === "block") {
        dropdownContent.style.display = "none";
      }
    });

    const options = this.getAttribute('options');
    if (options) {
      const parsedOptions = JSON.parse(options);
      parsedOptions.forEach(option => {
        const optionElement = document.createElement('div');
        const optionValue = document.createElement('p');
        optionElement.className = 'option_wrapper'
        optionValue.textContent = option.label
        optionValue.setAttribute('value',option.value)
        const img = document.createElement('img')
        img.src = './assets/select.svg'
        optionElement.appendChild(img)
        optionElement.appendChild(optionValue)
        dropdownContent.appendChild(optionElement);
      });
    }

    const optionsWrapper = cloneContent.querySelectorAll('#dropdownContent .option_wrapper')
    const optionValues = cloneContent.querySelectorAll('#dropdownContent .option_wrapper p')
    const optionImages = cloneContent.querySelectorAll('#dropdownContent .option_wrapper img')
    for (let index = 0; index < optionsWrapper.length; index++){
      optionsWrapper[index].addEventListener('click', () => {
        for (const optionImg of optionImages) { 
          optionImg.style.display = 'none'
        }
        optionImages[index].style.display = 'block'
        input.value = optionValues[index].innerHTML
        dropdownContent.style.display = "none";
      })
    }

    const shadow = this.attachShadow({mode: "open"})
    shadow.append(cloneContent)
  }
}

customElements.define('d5-select', D5SelectElement)

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
        
        span, a {
          cursor: pointer; 
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
          <div>
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
          <div>
            <d5-input
              id="password"
              type="password"
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
            <a href="">Forgot?</a>
            <span onClick="D5LoginPage.toSignUp()">Account does not exist? Sign Up?</span>
          </div>
        </form>
      </div>
    `
  
    const cloneContent = LoginPage.content.cloneNode(true)

    const shadow = this.attachShadow({mode: "open"})
    shadow.append(cloneContent)
  }

  static async onSubmit() { 
    if (D5FormValue?.email?.trim() && D5FormValue?.password?.trim() && !D5FormErrorValue?.email && !D5FormErrorValue?.password) {
      const D5Message = document.querySelector('d5-message');
      try {
        const response = await sendRequest("POST", `${baseUrl}/onboarding/login`, D5FormValue);
        setCookie('d5-onboarding-token', response.data.access)
        d5Onboarding?.setRoute('customer-details')
        messageValue = {
          value: 'Successfully Login',
          type: 'success'
        }
        D5Message.createMessage();
      } catch (error) {
        const D5Message = document.querySelector('d5-message');
        messageValue = {
          value: error.meta.message,
          type: 'error'
        }
        D5Message.createMessage();
      }
    }
  }

  static toSignUp() { 
    d5Onboarding?.setRoute('signUp')
  }
}

customElements.define('d5-login-page', D5LoginPage)

class D5SignUpPage extends HTMLElement { 
  constructor() { 
    super()
    const signUpPage = document.createElement('template')

    signUpPage.innerHTML = `
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

        .verification_code_wrapper {
          display: flex;
          justify-content: space-between;
        }
        
        .verification_code {
          position: relative;
          z-index: 2;
          cursor: pointer;
          width: 30%;
          height: 30px;
          font-size: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          margin-top: 26px;
        }

        .input {
          width: 67%;
        }
        
        .verification_code img {
          width: 100%;
          height: 100%;
        }

        .login_link {
          text-align: center;
        }

        span, a {
          cursor: pointer; 
          font-size: 12px;
          text-decoration: none;
          color: #195aff;
        }
      </style>

      <div class="login_card">
        <h2>
          Sign Up
        </h2>
        <div>
          <d5-input
            type="text"
            id="email"
            label="Email"
            name="email"
            required="Email is a required field."
            pattern="^\\S+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9._-]{2,}$"
            patternMessage="Please enter your email address."
          />
        </div>
        <div class="verification_code_wrapper">
          <div class="input">
            <d5-input
              type="text"
              id="verification_code"
              label="Verification Code"
              name="captcha_value"
              maxLength="4"
              required="Verification Code is a required field."
            />
          </div>
          <div class="verification_code">
            <img src=${this.verification_code} />
          </div>
        </div>
        <button class="login_button">
          Sign up
        </button>
        <div class="login_link">
          <span onClick="D5SignUpPage.toLogin()">Already sign up? Continue Onboarding</span>
        </div>
      </div>
    `;
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(signUpPage.content.cloneNode(true));

    this.getVerificationCode()
  }

  async getVerificationCode() { 
    try {
      const response = await sendRequest("POST", `${baseUrl}/captcha`);
      this.verification_code = `data:${response?.data?.image_type};${response?.data?.image_decode},${response?.data?.captcha_image}`
      captcha_key = response.data.captcha_key
      const verificationImg = this.shadowRoot.querySelector('.login_card .verification_code img')
      verificationImg.src = this.verification_code
    } catch (error) {
      const D5Message = document.querySelector('d5-message');
      messageValue = {
        value: error.meta.message,
        type: 'error'
      }
      D5Message.createMessage();
    }
  }

  static async onSubmit() { 
    const D5Message = document.querySelector('d5-message');
    try {
      await sendRequest("POST", `${baseUrl}/onboarding/sign-up`, {
        captcha_key,
        captcha_value: D5FormValue.captcha_value,
        email: D5FormValue.email,
        url,
      });
      messageValue = {
        value: 'Successfully sign up.',
        type: 'success'
      }
      D5Message.createMessage();
      d5Onboarding?.setRoute('login')
    } catch (error) {
      messageValue = {
        value: error.meta.message,
        type: 'error'
      }
      D5Message.createMessage();
    }
  }

  connectedCallback() { 
    const verificationCodeBox = this.shadowRoot.querySelector('.login_card .verification_code')

    verificationCodeBox.addEventListener('click', () => {
      this.getVerificationCode()
    })

    const button = this.shadowRoot.querySelector('button')

    button.addEventListener('click', () => { 
      D5SignUpPage.onSubmit()
    })
  }

  static toLogin() { 
    d5Onboarding?.setRoute('login')
  }
}

customElements.define('d5-sign-up-page', D5SignUpPage)

class D5CustomerPage extends HTMLElement { 
  constructor() { 
    super()
  }

  connectedCallback() { 
    this.render()
  }

  render() { 
    const D5CustomerPageElement = document.createElement('template')
    
    D5CustomerPageElement.innerHTML = `
      <style>
        .flex {
          display: flex;
          justify-content: space-between
        }

        .left {
          flex: 1;
        }

        .right {
          min-width: 850px;
        }

        .small {
          width: 23%;
        }

        .large {
          width: 74.4%;
        }
      </style>

      <div class="flex">
        <div class="left">

        </div>
        <div class="right">
          
          <form>
            <div class="flex">
              <div class="small">
                <d5-new-input
                  type="text"
                  id="first_name"
                  label="First Name"
                  name="first_name"
                  required="Name is a required field."
                />
              </div>
              <div class="small">
                <d5-new-input
                  type="text"
                  id="last_name"
                  label="Last Name"
                  name="last_name"
                  required="Name is a required field."
                />
              </div>
              <div class="small">
                <d5-new-input
                  type="text"
                  id="email"
                  label="Email"
                  name="email"
                  required="Email is a required field."
                  pattern="^\\S+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9._-]{2,}$"
                  patternMessage="Please enter your email address."
                />
              </div>
              <div class="small">
                <d5-new-input
                  type="text"
                  id="company"
                  label="Company"
                  name="company"
                  required="Company is a required field."
                />
              </div>
            </div>
            <div class="flex">
              <div class="large">
                <d5-new-input
                  type="text"
                  id="address1"
                  label="Address (line 1)"
                  name="address1"
                />
              </div>
              <div class="small">
                <d5-new-input
                  type="text"
                  id="phone"
                  label="Phone"
                  name="phone"
                />
              </div>
            </div>
            <div class="flex">
              <div class="large">
                <d5-new-input
                  type="text"
                  id="address2"
                  label="Address (line 2)"
                  name="address2"
                />
              </div>
              <div class="small">
                <d5-select
                  options='[
                    {"label": "选项1", "value": "option1"},
                    {"label": "选项2", "value": "option2"}
                  ]'
                  type="text"
                  id="revenue"
                  label="Revenue"
                  name="revenue"
                  required="Revenue is a required filed;"
                />
              </div>
            </div>
            <div class="flex">
              <div class="smalll">
                <d5-new-input
                  type="text"
                  id="country"
                  label="Country"
                  name="country"
                  disabled
                  value="US"
                />
              </div>
              <div class="small">
                <d5-select
                  options='[
                    {"label": "选项1", "value": "option1"},
                    {"label": "选项2", "value": "option2"}
                  ]'
                  type="text"
                  id="state"
                  label="State"
                  name="state"
                  required="Revenue is a required filed;"
                />
              </div>
              <div class="small">
                <d5-select
                  options='[
                    {"label": "选项1", "value": "option1"},
                    {"label": "选项2", "value": "option2"}
                  ]'
                  type="text"
                  id="revenue"
                  label="City"
                  name="city"
                  required="Revenue is a required filed;"
                />
              </div>
              <div class="smalll">
                <d5-new-input
                  type="text"
                  id="zip"
                  label="Zip"
                  name="zip"
                />
              </div>
            </div>
            <div class="flex">
              <div class="small">
                <d5-new-input
                  type="text"
                  id="store_name"
                  label="Store Name"
                  name="store_name"
                  required="Store name is a required filed;"
                />
              </div>
              <div class="large">
                <d5-new-input
                  type="text"
                  id="description"
                  label="Description"
                  name="description"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    `

    const cloneContent = D5CustomerPageElement.content.cloneNode(true)

    const shadow = this.attachShadow({ mode: 'open' })
    shadow.append(cloneContent)
  }
}

customElements.define('d5-customer-details-page', D5CustomerPage)

class D5Onboarding { 
  constructor(config) { 
    this.trigger = config?.trigger || 'flat'
    this.container = config?.container
    this.route = 'login'
    url = config.url || ''
    this.initD5Message()
  }

  init() { 
    if (this.trigger === 'flat') {
      this.setRoute('customer-details')
    } else { 
      const container = document.querySelector(this.container)
      container.addEventListener('click', () => { 
        this.setRoute('login')
      })
    }
  }

  initD5Message(){ 
    const d5Message = document.createElement('d5-message');
    const container = document.querySelector(this.container);
    container.appendChild(d5Message);
  }

  setRoute(route){
    D5FormValue = {}
    D5FormErrorValue = {}

    this.route = route
    const page = document.getElementById('onboarding-page')
    if (page) {
      this.removeElement(document.querySelector('#onboarding-page'))
    }

    const container = document.querySelector(this.container);
    container.style.height="100%"
    const boardingPage = document.createElement('div')
    boardingPage.id = 'onboarding-page'
    boardingPage.style.height="100%"
    container.appendChild(boardingPage);

    switch (route) {
      case 'login':
        boardingPage.appendChild(document.createElement('d5-login-page'))
        break
      case 'signUp':
        boardingPage.appendChild(document.createElement('d5-sign-up-page'))
        break
      case 'customer-details': 
        boardingPage.appendChild(document.createElement('d5-customer-details-page'))
        break
      default:
        boardingPage.appendChild(document.createElement('d5-login-page'))
        break
    }
  }

  removeElement = (element) => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element)
    }
  }
}