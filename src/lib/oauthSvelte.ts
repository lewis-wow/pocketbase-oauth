import { writable } from 'svelte/store'
import type PocketBase from 'pocketbase'
import OAuth from './oauth'

class OAuthSvelte extends OAuth {
	private svelteStore = writable({
		token: this.pb.authStore.token,
		model: this.pb.authStore.model,
		isValid: this.pb.authStore.isValid,
	})
	public subscribe = this.svelteStore.subscribe

	constructor(pb: PocketBase) {
		super(pb)

		this.addEventListener('change', () => this.svelteStore.set({
			token: this.pb.authStore.token,
			model: this.pb.authStore.model,
			isValid: this.pb.authStore.isValid
		}))
	}
}

export default OAuthSvelte
