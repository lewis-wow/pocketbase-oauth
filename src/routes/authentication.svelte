<script>
	import PocketBase from 'pocketbase';
	import OAuth from '../lib/oauth';

	const client = new PocketBase('http://127.0.0.1:8090');
	const oauth = new OAuth(client);

	oauth.response();
</script>

<p>loading...</p>
