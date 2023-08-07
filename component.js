class D5InputElement extends HTMLElement { 
  constructor() { 
    super()
    const D5Input = document.createElement('template')
    D5Input.innerHTML = `
      <style>
      label {
        cursor: pointer;
        font-size: 12px;
      }
      
      input {
        width: 100%;
        border: 1px solid #d9d9d9;
        height: 32px;
        margin-top: 5px;
        border-radius: 4px;
      }
      
      input:focus {
        outline: none;
        text-indent: 4px;
      }
      </style>
  
      <input />
    `
  
    const cloneContent = D5Input.content.cloneNode(true)
    const element = cloneContent.querySelector('input')
  
    element.addEventListener('input', (event) => { 
      console.log(event.target.value)
    })

    const shadow = this.attachShadow({mode: "open"})
    shadow.append(cloneContent)
  }
}

customElements.define('d5-input', D5InputElement)


class D5Onboarding { 
  constructor(config) { 
    this.trigger = config?.trigger || 'flat'
    this.container = config?.container
    this.route = 'login'
  }

  init() { 
    const styleElement = document.createElement('style');
    styleElement.appendChild(document.createTextNode(style));
    document.head.appendChild(styleElement);

    this.fragment = new DocumentFragment()

    this.renderLoginPage()

    document.body.append(this.fragment)
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
    const loginCard = this.fragment.appendChild(D5Onboarding.createElement('div', 'd5_login_card'))
    loginCard.appendChild(D5Onboarding.createElement('h2', '', 'Login'))

    loginCard.appendChild(D5Onboarding.createElement('label', '', 'Account', {
      for: 'account',
    }))
    const inputWrapper1 = loginCard.appendChild(D5Onboarding.createElement('div', 'input'))
    const d5Input1 = new D5InputElement()
    inputWrapper1.appendChild(d5Input1)

    loginCard.appendChild(D5Onboarding.createElement('label', '', 'Password', {
      for: 'password',
    }))
    const inputWrapper2 = loginCard.appendChild(D5Onboarding.createElement('div', 'input'))
    const d5Input2 = new D5InputElement()
    inputWrapper2.appendChild(d5Input2)

    loginCard.appendChild(D5Onboarding.createElement('button', 'login_button', 'Login'))
    const loginLink = loginCard.appendChild(D5Onboarding.createElement('div', 'login_link_flex'))
    loginLink.appendChild(D5Onboarding.createElement('a', '', 'Forgot?', {
      href: 'https://d5devcdn.mez100.com.cn/products',
    }))
    const toSignUpLink = loginLink.appendChild(D5Onboarding.createElement('a', 'login_a', 'Account does not exist? Sign Up', {
      href: '',
    }))
    toSignUpLink.addEventListener('click', () => {
      this.setRoute('signUp')
    })

    const container = document.querySelector(this.container)
    const page = container?.appendChild(D5Onboarding.createElement('div', '', '', {
      id: 'onboarding-page',
    }))
    page?.appendChild(this.fragment)
  }

  static createElement = (type, className, html = '', attribute = {}) => {
    const element = document.createElement(type)
    element.className = className
    element.innerHTML = html
    Object.keys(attribute).forEach((key) => {
      element.setAttribute(key, attribute[key])
    })
    return element
  }

  static removeElement = (element) => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element)
    }
  }
}