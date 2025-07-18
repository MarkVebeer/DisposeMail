<script>
import f from './helper.js';

let username = '';
let password = '';
let error = '';

function submit() {
  error = '';
  f.fetchPost('/login', { username, password }, (res) => {
    if (res.success) {
      window.location = '/';
    } else {
      if (res.error === 'Invalid credentials') {
        error = 'Hibás felhasználónév vagy jelszó!';
      } else {
        error = res.error || 'Login failed';
      }
    }
  });
}
</script>

<main class="flexCenterCol fillHeight gap">
  <div class="adaptWidthSmall">
    <h2 style="text-align: center; margin-bottom: 1.5rem;">Login</h2>
    {#if error}
      <div style="color: red; margin-bottom: 10px; text-align: center;">{error}</div>
    {/if}
    <input class="input" placeholder="Username" bind:value={username} on:keydown={(e) => e.key === 'Enter' && submit()} autofocus>
    <input class="input" placeholder="Password" type="password" bind:value={password} on:keydown={(e) => e.key === 'Enter' && submit()}>
    <button class="button" on:click={submit}>Login</button>
  </div>
</main>

<style>
body, main, html {
  background: #000 !important;
}
.flexCenterCol {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.fillHeight {
  min-height: 100vh;
}
.gap > * + * {
  margin-top: 1rem;
}
.adaptWidthSmall {
  max-width: 350px;
  width: 100%;
  margin: 0 auto;
  background: rgba(255,255,255,0.95);
  border-radius: 10px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  padding: 2rem 2rem 1.5rem 2rem;
}
.input {
  display: block;
  width: 100%;
  margin-bottom: 1rem;
  padding: 10px;
  font-size: 1.1rem;
  border-radius: 7px;
  outline: 1px solid #bbb;
  border: none;
  background: #f9f9f9;
  color: #222;
  box-sizing: border-box;
}
.button {
  width: 100%;
  padding: 10px;
  font-size: 1.1rem;
  border-radius: 7px;
  border: none;
  background: #222;
  color: #fff;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
}
.button:hover {
  background: #444;
}
@media (prefers-color-scheme: dark) {
  body, main, html {
    background: #000 !important;
  }
  .adaptWidthSmall {
    background: #181818;
    color: #fff;
    box-shadow: 0 2px 16px rgba(0,0,0,0.3);
  }
  .input {
    background: #222;
    color: #fff;
    outline: 1px solid #444;
  }
  .button {
    background: #fff;
    color: #222;
  }
  .button:hover {
    background: #eee;
  }
}
</style> 