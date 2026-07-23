export const PACKAGE_PATH = 'gno.land/r/gnoland/boards2/v1'
export const BREADCRUMBS = PACKAGE_PATH.replace('gno.land/', '').split('/')

/**
 * The chain boards2 talks to.
 *
 * Previously the network arrived from the wallet's `tosignin` reply. GnoConnect
 * `connect` deliberately does not return an RPC endpoint — a dapp must never
 * take one from a callback it cannot authenticate — so boards2 owns this now.
 * Single place to point the app at another chain.
 */
export const REMOTE = '127.0.0.1:26657'
export const CHAIN_ID = 'dev'
