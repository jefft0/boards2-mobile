export const PACKAGE_PATH = 'gno.land/r/gnoland/boards2/v0'

// The GraphQL endpoint of the tx indexer, used to recover the original body of
// a deleted post from the transaction that created it. Hardwired to the berty
// dev chain for the demo: the indexer has no place in the network presets yet,
// so this does not follow the chain the app is connected to.
export const TX_INDEXER_URL = 'https://txindexer.gno.berty.io/graphql/query'

// The body the realm writes over a deleted post that still has replies, which
// it soft deletes to keep those replies reachable (boards2 DeleteReply). A
// post whose body is exactly this is deleted rather than flagged: `hidden`
// stays false and the original text lives on only in the creating transaction.
export const DELETED_POST_BODY = '⚠ This comment has been deleted'
export const BREADCRUMBS = PACKAGE_PATH.replace('gno.land/', '').split('/')
