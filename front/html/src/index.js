import './style.css'
import './layout.css'
import App from './index.svelte'

fetch('/me', { method: 'POST' })
  .then(res => res.ok ? res.json() : null)
  .then(user => {
    if (!user) {
      window.location = '/login.html';
    } else if (user.isAdmin) {
      window.location = '/manage.html';
    } else {
      new App({ target: document.getElementById('app') });
    }
  })
  .catch(() => {
    window.location = '/login.html';
  });
