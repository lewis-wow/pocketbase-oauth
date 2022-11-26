import PocketBase from 'pocketbase'
import type { AuthProviderInfo, BaseAuthStore } from 'pocketbase'

type OAuthEvents = 'success' | 'error' | 'change'

class OAuth {
	public providers = {}
	protected events = {}
	protected redirectUrl: string
	protected localStorageKey = 'oauth-provider'

	constructor(protected pb: PocketBase, { redirectUrl = `${window.location.origin}/oauth` } = { redirectUrl: `${window.location.origin}/oauth` }) {
		this.redirectUrl = redirectUrl
		this.store.onChange(() => this.triggerEvent('change'))

		if (this.store.isValid || window.location.pathname !== (new URL(redirectUrl)).pathname) {
			window.localStorage.removeItem(this.localStorageKey)
			return this
		}

		const params = new URL(window.location.href).searchParams
		const [state, code] = [params.get('state'), params.get('code')]
		const oAuthStorage = window.localStorage.getItem(this.localStorageKey)

		if (oAuthStorage === null || state === null || code === null) throw Error("Missing state or code parameter.")

		const { provider, createData } = JSON.parse(oAuthStorage)
		if (provider.state !== state) throw Error("State parameters don't match.")

		pb.collection('users').authWithOAuth2(
			provider.name,
			code,
			provider.codeVerifier,
			this.redirectUrl,
			createData
		).then(data => this.triggerEvent('success', { provider, data }))
			.catch(err => this.triggerEvent('error', err))
	}

	fetch(providerName: string, createData = { emailVisibility: false }) {
		const provider = this.providers[providerName]
		const fetchUrl = `${provider.authUrl}${this.redirectUrl}`

		window.localStorage.setItem(this.localStorageKey, JSON.stringify({
			provider,
			createData
		}))
		window.location.href = fetchUrl
	}

	addEventListener(eventName: OAuthEvents, eventCallback: (e: any) => any) {
		if (eventName in this.events)
			this.events[eventName].push(eventCallback)
		else
			this.events[eventName] = [eventCallback]
	}

	removeEventListener(eventName: OAuthEvents, eventCallback: (e: any) => any) {
		if (!(eventName in this.events)) return

		const index = this.events[eventName].indexOf(eventCallback)
		this.events[eventName].splice(index, 1)
	}

	async loadProviders() {
		const providers = await this._loadProviders()
		this.providers = providers

		return Object.values(providers)
	}

	get store(): BaseAuthStore {
		return this.pb.authStore
	}

	logout() {
		this.pb.authStore.clear()
	}

	protected triggerEvent(eventName: OAuthEvents, ctx?: any) {
		if (!(eventName in this.events)) return

		const subscribers = this.events[eventName]
		subscribers.forEach(subscriber => subscriber(ctx))
	}

	private async _loadProviders() {
		const authMethods = await this.pb.collection('users').listAuthMethods()

		const OAuthProviders: { [key: string]: AuthProviderInfo } = {}

		for (const authMethod of authMethods.authProviders) {
			OAuthProviders[authMethod.name] = authMethod
		}

		return OAuthProviders
	}
}

export default OAuth
