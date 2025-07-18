import './style.css'
import './layout.css'
import App from './manage.svelte'

fetch('/me', { method: 'POST' })
  .then(res => res.ok ? res.json() : null)
  .then(user => {
    if (!user) {
      window.location = '/login.html';
    } else if (!user.isAdmin) {
      window.location = '/';
    } else {
      new App({ target: document.getElementById('app') });
    }
  })
  .catch(() => {
    window.location = '/login.html';
  });
