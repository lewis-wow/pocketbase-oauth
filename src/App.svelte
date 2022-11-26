<script>
	import PocketBase from 'pocketbase';
	import OAuth from './lib/oauth';

	const client = new PocketBase('http://127.0.0.1:8090');
	const oauth = new OAuth(client);

	oauth.addEventListener('success', () => {
		window.location.pathname = '/';
	});
</script>

{#if window.location.pathname === '/oauth'}
	<p>loading...</p>
{:else}
	<button on:click={() => oauth.logout()}>Logout</button>

	{#await oauth.loadProviders() then providers}
		{#each providers as provider}
			<button on:click={() => oauth.fetch(provider.name)}>
				Github
			</button>
		{/each}
	{/await}
{/if}
