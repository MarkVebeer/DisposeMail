<script>

	import { onMount } from 'svelte';
	import f from './helper.js'
	import dialog from './lib/dialog.js'
	dialog.init();

	let domainName = "";
	let addresses = [];
	let selectedAddress = null;

	let mails = [];
	let page = 1;
	let viewType = "mails";

	let mailDataSender;
	let mailDataSubject;

	let newAddressText = "";
	let showManagePopup = false;
	let searchText = "";
	let filteredAddresses = [];

	let addressSearch = "";
	let showDropdown = false;
	let dropdownIndex = -1;

	function refreshMails(){

		f.fetchPost('/mails', {addr: selectedAddress, page: page}, (data) => {

			mails = data;

		});

	}

	function selectedAddressChange(){
		
		page = 1;
		refreshMails();
		localStorage.setItem("address", selectedAddress);

	}

	function copyClicked(){
		
		f.copyToClipboard(selectedAddress + domainName);

	}

	function waitForElement(selector) {

		return new Promise((resolve) => {
			
			const observer = new MutationObserver((mutationsList, observer) => {

				for (let mutation of mutationsList) {
					
					if (mutation.type === 'childList' && document.querySelector(selector)) {

						observer.disconnect();
						resolve(document.querySelector(selector));
						return;

					}

				}

			});

			observer.observe(document.body, { childList: true, subtree: true });

		});

	}

	function mailClicked(event){

		if((event.type == 'keypress' && event.key == 'Enter') || (event.type == 'click' && event.button == 0)){

			let closest = event.target.closest(".clickable");
			f.fetchPost('/mailData', {id: closest.dataset.id}, (data) => {

				mailDataSender = data.sender;
				mailDataSubject = data.subject;

				viewType = 'mailData';

				waitForElement("#mailData").then((element)=>{

					const shadowRoot = element.attachShadow({ mode: 'open' });
					shadowRoot.innerHTML = data.content;

				})

			});
			
		}

	}

	function deleteClicked(event){
		
		if((event.type == 'keydown' && event.key == 'Enter') || (event.type == 'click' && event.button == 0)){

			dialog.conf("delete?", (res) => {
				
				if(res){

					f.fetchPost('/deleteMail', {id: event.target.dataset.id}, () => {

						refreshMails();
				
					});

				}

			})

		}

		event.stopPropagation();

	}

	function backClicked(){
		
		//cleanup
		mailDataSender = null;
		mailDataSubject = null;
		viewType = "mails"

	}

	function nextPage(){

		if(mails.length > 0){
			page += 1;
			refreshMails();
		}
	}

	function prevPage(){
		
		if(page > 1){

			page -= 1;
			refreshMails();
	
		}

	}

	function logout() {
  f.fetchPost('/logout', {}, () => {
    window.location = '/login.html';
  });
}

	function addAddress() {
  const regex = /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}$/;
  if (regex.test(newAddressText)) {
    f.fetchPost('/addAddress', { address: newAddressText }, (data) => {
      if (data == "exist") {
        dialog.alrt("address already exist");
      }
      if (data == "done") {
        newAddressText = "";
        refreshAddresses();
      }
    });
  } else {
    dialog.alrt("Invalid email address");
  }
}
function deleteAddress() {
  if (!selectedAddress) return;
  dialog.conf("Delete this address?", (res) => {
    if (res) {
      f.fetchPost('/deleteAddress', { address: selectedAddress }, (data) => {
        if (data == "done") {
          refreshAddresses();
        }
      });
    }
  });
}
function openManagePopup() {
  searchText = "";
  filterAddresses();
  showManagePopup = true;
}
function closeManagePopup() {
  showManagePopup = false;
}
function filterAddresses() {
  if (!addressSearch) {
    filteredAddresses = addresses;
  } else {
    filteredAddresses = addresses.filter(a => a.addr.toLowerCase().includes(addressSearch.toLowerCase()));
  }
  // Default to first item selected if dropdown is open and there are results
  dropdownIndex = filteredAddresses.length > 0 ? 0 : -1;
}
function addAddressInPopup() {
  const regex = /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}$/;
  if (regex.test(newAddressText)) {
    f.fetchPost('/addAddress', { address: newAddressText }, (data) => {
      if (data == "exist") {
        dialog.alrt("address already exist");
      }
      if (data == "done") {
        newAddressText = "";
        refreshAddresses(() => filterAddresses());
      }
    });
  } else {
    dialog.alrt("Invalid email address");
  }
}
function deleteAddressInPopup(addr) {
  dialog.conf("Delete this address?", (res) => {
    if (res) {
      f.fetchPost('/deleteAddress', { address: addr }, (data) => {
        if (data == "done") {
          refreshAddresses(() => filterAddresses());
        }
      });
    }
  });
}
function refreshAddresses(cb) {
  f.fetchPost('/addresses', {}, (data) => {
    addresses = data.addresses;
    filterAddresses();
    if (addresses.length > 0) {
      selectedAddress = addresses[addresses.length - 1].addr;
      let lastSelectedAddress = localStorage.getItem("address");
      if (lastSelectedAddress !== null && addresses.some(address => address.addr == lastSelectedAddress)) {
        selectedAddress = lastSelectedAddress;
      }
      refreshMails();
      setInterval(() => {
        refreshMails();
      }, data.refreshInterval * 1000);
    } else {
      selectedAddress = null;
      mails = [];
    }
    if (cb) cb();
  });
}

	function filterSelectorAddresses() {
  if (!addressSearch) return addresses;
  return addresses.filter(a => a.addr.toLowerCase().includes(addressSearch.toLowerCase()));
}
function selectAddress(addr) {
  selectedAddress = addr;
  addressSearch = addr;
  showDropdown = false;
  selectedAddressChange();
}

	function handleAddressSearchInput(e) {
  addressSearch = e.target.value;
  showDropdown = true;
  filterAddresses();
  dropdownIndex = filteredAddresses.length > 0 ? 0 : -1;
}
function handleAddressSearchFocus(e) {
  showDropdown = true;
  if (addressSearch) {
    e.target.select();
  }
  filterAddresses();
  dropdownIndex = filteredAddresses.length > 0 ? 0 : -1;
}
function handleAddressSearchKeydown(e) {
  if (!showDropdown || filteredAddresses.length === 0) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    dropdownIndex = (dropdownIndex + 1) % filteredAddresses.length;
    scrollDropdownIntoView();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    dropdownIndex = (dropdownIndex - 1 + filteredAddresses.length) % filteredAddresses.length;
    scrollDropdownIntoView();
  } else if (e.key === 'Enter') {
    if (dropdownIndex === -1 && filteredAddresses.length > 0) {
      dropdownIndex = 0;
    }
    if (dropdownIndex >= 0 && dropdownIndex < filteredAddresses.length) {
      selectAddress(filteredAddresses[dropdownIndex].addr);
    }
  }
}
function scrollDropdownIntoView() {
  setTimeout(() => {
    const el = document.querySelector('.dropdown-item.selected');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, 0);
}

	function toggleKeep(addr, keep) {
  f.fetchPost('/setAddressKeep', { address: addr, keep }, (data) => {
    if (data == "done") {
      refreshAddresses(() => filterAddresses());
    }
  });
}

	onMount(() => {

		refreshAddresses();
		f.fetchPost('/domain', {}, (data) => {

			domainName = '@' + data;

		})

	});

</script>

<main>
	
	<div class="adaptWidth flexCenterCol fillHeight gap">

		<!--Put a div so that there will be a gap from the flex at the top of the page-->
		<div></div>
		
		<div class="adaptWidthSmall" style="display: flex; align-items: center; flex-wrap: wrap; position: relative;">

			<input
        placeholder="Search or select address"
        bind:value={addressSearch}
        on:input={handleAddressSearchInput}
        on:focus={handleAddressSearchFocus}
        on:keydown={handleAddressSearchKeydown}
        on:blur={() => setTimeout(() => showDropdown = false, 150)}
        style="flex: 1"
      >
      {#if showDropdown}
        <ul class="dropdown-list">
          {#each filteredAddresses as address, i}
            <li class="dropdown-item {dropdownIndex === i ? 'selected' : ''}" on:mousedown={() => selectAddress(address.addr)}>{address.addr}</li>
          {/each}
        </ul>
      {/if}
			<span>{domainName}</span>

			<button on:keypress={copyClicked} on:click={copyClicked} style="margin-left: 10px; padding-top: 0px; padding-bottom: 0px">Copy</button>

		</div>

		<!-- Manage addresses popup trigger -->
		<button on:click={openManagePopup} class="adaptWidthSmall">Manage addresses</button>
		<!-- Popup dialog -->
		{#if showManagePopup}
			<div class="popup-overlay">
				<div class="popup">
					<div style="display: flex; justify-content: space-between; align-items: center;">
						<h3>Your addresses</h3>
						<button on:click={closeManagePopup}>X</button>
					</div>
					<input placeholder="Search addresses" bind:value={searchText} on:input={filterAddresses} style="width: 100%; margin-bottom: 10px;">
					<ul style="max-height: 200px; overflow-y: auto; padding: 0; margin: 0; list-style: none;">
						{#each filteredAddresses as address}
							<li style="display: flex; align-items: center; justify-content: space-between; padding: 4px 0;">
								<label style="margin-right: 10px; display: flex; align-items: center;">
									<input type="checkbox" checked={address.keep} on:change={e => toggleKeep(address.addr, e.target.checked)}>
									<span style="margin-left: 4px; font-size: 1.2em;">{address.keep ? '🔒' : ''}</span>
								</label>
								<span>{address.addr}{domainName}</span>
								<button on:click={() => deleteAddressInPopup(address.addr)} style="margin-left: 10px;">Delete</button>
							</li>
						{/each}
					</ul>
					<div style="display: flex; margin-top: 10px;">
						<input bind:value={newAddressText} placeholder="New address" style="flex: 1">
						<button on:click={addAddressInPopup} style="margin-left: 10px;">Add</button>
					</div>
				</div>
			</div>
		{/if}

		<div id="mailList" class="fillWidth">
			
			{#if viewType == 'mails'}

				{#each mails as mail}

					<div data-id={mail.id} on:keypress={mailClicked} on:click={mailClicked} role="button" tabindex="0" class="clickable" style="display: flex; align-items: center; justify-content: space-between">

						<div> 

							<span>{mail.sender}</span>
							<div></div>
							<span>{mail.subject}</span>

						</div>

						<input data-id={mail.id} on:keypress={deleteClicked} on:click={deleteClicked} type="image" src="trashIcon.svg" alt="X" style="width: 2rem; height: 2rem; padding: 1rem">

					</div>
					
					<!--hr size inside flex is 0, gotta wrap with div, not sure why-->
					<div>
						<hr>
					</div>

				{/each}

			{/if}

			{#if viewType == 'mailData'}

				<span>{mailDataSender}</span>
				<div></div>
				<span>{mailDataSubject}</span>

				<!--hr size inside flex is 0, gotta wrap with div, not sure why-->
				<div>
					<hr>
				</div>

				<div id="mailData" style="all: initial; background-color: white; overflow: auto; flex: 1">
				</div>

				<div style="height: 10px;"></div>
				<button on:click={backClicked}>Back</button>

			{/if}

		</div>

		<div>
			<button class="counter" on:click={prevPage}>❮</button>
			<span>{page}</span>
			<button class="counter" on:click={nextPage}>❯</button>
		</div>

		<button on:click={logout} class="adaptWidthSmall">Logout</button>

		<!--Put a div so that there will be a gap from the flex at the top of the page-->
		<div></div>

	</div>
	
</main>

<style>
.popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.popup {
  background: white;
  color: black;
  border-radius: 8px;
  padding: 24px;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: 0 2px 16px rgba(0,0,0,0.2);
}
@media (prefers-color-scheme: dark) {
  .popup {
    background: #222;
    color: #fff;
  }
}
.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  color: black;
  border: 1px solid #ccc;
  border-radius: 0 0 8px 8px;
  max-height: 10.5em; /* 5 items at 2.1em each */
  overflow-y: auto;
  z-index: 1001;
  margin: 0;
  padding: 0;
  list-style: none;
}
.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
}
.dropdown-item.selected, .dropdown-item:hover {
  background: #eee;
}
@media (prefers-color-scheme: dark) {
  .dropdown-list {
    background: #222;
    color: #fff;
    border-color: #444;
  }
  .dropdown-item.selected, .dropdown-item:hover {
    background: #333;
  }
}
</style>
