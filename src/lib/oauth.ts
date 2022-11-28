import type PocketBase from 'pocketbase'
import type { AuthProviderInfo, Admin, RecordAuthResponse, Record as PocketBaseRecord } from 'pocketbase'
import { writable } from 'svelte/store'

class OAuth {
	public providers = {}
	protected events = {}
	public localStorageKey = 'oauth-provider'
	protected store = writable<{ token: string, model: PocketBaseRecord | Admin | null, isValid: boolean }>({ token: '', model: null, isValid: false })
	public subscribe = this.store.subscribe

	constructor(protected pb: PocketBase, public redirectUrl = `${window.location.origin}/oauth`) {
		this.pb.authStore.onChange(() => {
			this.store.set({
				token: this.pb.authStore.token,
				model: this.pb.authStore.model,
				isValid: this.pb.authStore.isValid,
			})
		}, true)
	}

	response(pathname = '/') {
		return new Promise<RecordAuthResponse<PocketBaseRecord>>(async (resolve, reject) => {
			const params = new URL(window.location.href).searchParams
			const [state, code] = [params.get('state'), params.get('code')]
			const oAuthStorage = window.localStorage.getItem(this.localStorageKey)
			window.localStorage.removeItem(this.localStorageKey)

			if (oAuthStorage === null || state === null || code === null) throw Error("Missing state or code parameter.")

			const provider = JSON.parse(oAuthStorage)
			if (provider.state !== state) throw Error("State parameters don't match.")

			await this.pb.collection('users').authWithOAuth2(
				provider.name,
				code,
				provider.codeVerifier,
				this.redirectUrl
			)

			window.location.href = pathname
		})
	}

	request(provider: AuthProviderInfo) {
		const fetchUrl = `${provider.authUrl}${this.redirectUrl}`
		window.localStorage.setItem(this.localStorageKey, JSON.stringify(provider))

		window.location.href = fetchUrl
	}

	async loadProviders() {
		const authMethods = await this.pb.collection('users').listAuthMethods()
		return authMethods.authProviders
	}

	logout() {
		this.pb.authStore.clear()
	}
}

export default OAuth
