const style = `
  .d5_login_card {
    max-width: 360px;
    min-width: 180px;
    padding: 48px;
    background-color: #fff!important;
    margin: auto;
  }

  .d5_login_card h2 {
    margin-bottom: 24px;
  }
  
  .d5_login_card label {
    cursor: pointer;
    font-size: 12px;
  }

  .d5_login_card button.login_button {
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
  
  .d5_login_card .login_link {
    text-align: center;
  }
  
  .d5_login_card .login_link_flex {
    display: flex;
    justify-content: space-between;
  }
  
  .d5_login_card .login_link a, .login_link_flex a {
    font-size: 12px;
    text-decoration: none;
    color: #195aff;
  }
`

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
          <d5-input type="text" id="account" />
        </div>
        <label for="password">Password</label>
        <div class="input">
          <d5-input type="text" id="password" />
        </div>
        <button class="login_button">
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