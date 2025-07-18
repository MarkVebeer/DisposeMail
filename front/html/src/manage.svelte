<script>
import { onMount } from 'svelte';
import f from './helper.js';
import dialog from './lib/dialog.js';
dialog.init();

let hostName = '';
let addresses = [];
let users = [];
let selectedUser = null;
let newPassword = '';
let isAdmin = false;
let error = '';

// Registration fields
let regUsername = '';
let regPassword = '';
let regIsAdmin = false;
let regError = '';

function refreshUsers() {
  f.fetchPost('/admin/users', {}, (data) => {
    if (data.error) {
      error = data.error;
      users = [];
    } else {
      users = data.users;
      error = '';
    }
  });
}

function registerUser() {
  regError = '';
  if (!regUsername || !regPassword) {
    regError = 'All fields required';
    return;
  }
  f.fetchPost('/admin/registerUser', {
    username: regUsername,
    password: regPassword,
    isAdmin: regIsAdmin
  }, (data) => {
    if (data.success) {
      regUsername = '';
      regPassword = '';
      regIsAdmin = false;
      regError = '';
      refreshUsers();
    } else {
      regError = data.error || 'Registration failed';
    }
  });
}

function deleteUser() {
  if (!selectedUser) return;
  dialog.conf('Delete this user?', (res) => {
    if (res) {
      f.fetchPost('/admin/deleteUser', { id: selectedUser.id }, (data) => {
        if (data.success) {
          refreshUsers();
        } else {
          dialog.alrt(data.error || 'Failed to delete user');
        }
      });
    }
  });
}

function changePassword() {
  if (!selectedUser || !newPassword) return;
  f.fetchPost('/admin/changePassword', { id: selectedUser.id, password: newPassword }, (data) => {
    if (data.success) {
      dialog.alrt('Password changed');
      newPassword = '';
    } else {
      dialog.alrt(data.error || 'Failed to change password');
    }
  });
}

function logout() {
  f.fetchPost('/logout', {}, () => {
    window.location = '/login.html';
  });
}

onMount(() => {
  f.getCurrentUser((user) => {
    isAdmin = user && user.isAdmin;
    if (isAdmin) {
      refreshUsers();
    }
  });
  f.fetchPost('/domain', {}, (data) => {
    hostName = '@' + data;
  });
});
</script>

<main>
  <div class="adaptWidth flexCenterCol fillHeight gap">
    <div></div>
    {#if isAdmin}
      <span>Admin Panel</span>
      {#if error}
        <div style="color: red">{error}</div>
      {/if}
      <div class="adaptWidthSmall" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
        <h3>Register New User</h3>
        {#if regError}
          <div style="color: red">{regError}</div>
        {/if}
        <input placeholder="Username" bind:value={regUsername}>
        <input placeholder="Password" type="password" bind:value={regPassword}>
        <label><input type="checkbox" bind:checked={regIsAdmin}> Admin</label>
        <button on:click={registerUser}>Register User</button>
      </div>
      <div class="adaptWidthSmall" style="display: flex; flex-wrap: wrap">
        <select bind:value={selectedUser} style="flex: 1">
          <option value={null}>Select user</option>
          {#each users as user}
            <option value={user}>{user.username}</option>
          {/each}
        </select>
      </div>
      <button on:click={deleteUser} disabled={!selectedUser} class="adaptWidthSmall">Delete user</button>
      <div class="adaptWidthSmall" style="display: flex; flex-wrap: wrap">
        <input placeholder="New password" type="password" bind:value={newPassword} style="flex: 1">
        <button on:click={changePassword} disabled={!selectedUser || !newPassword}>Change password</button>
      </div>
      <button on:click={logout} class="adaptWidthSmall">Logout</button>
      <div style="height: 30px;"></div>
    {/if}
    <div></div>
  </div>
</main>
