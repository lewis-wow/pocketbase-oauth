<script>
	import PocketBase from 'pocketbase';
	import { Router, Route } from 'svelte-routing';

	import OAuth from './lib/oauth';
	import Authentication from './routes/authentication.svelte';

	const client = new PocketBase('http://127.0.0.1:8090');
	const oauth = new OAuth(client);
</script>

<main>
	<Router>
		<Route path="/">
			{#if $oauth.isValid}
				<p>{JSON.stringify($oauth)}</p>
				<button on:click={() => oauth.logout()}>Logout</button>
			{:else}
				{#await oauth.loadProviders() then providers}
					{#each providers as provider}
						<button on:click={() => oauth.request(provider)}>
							{provider.name}
						</button>
					{/each}
				{/await}
			{/if}
		</Route>

		<Route path="/oauth" component={Authentication} />
	</Router>
</main>
