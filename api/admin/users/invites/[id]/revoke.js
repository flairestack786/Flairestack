import { createAdminPostHandler, readQueryParam } from '../../../../../server/lib/vercelAdminHandler.mjs'
import { handleRevokeInvite } from '../../../../../server/lib/adminUsersHandlers.mjs'

/** POST /api/admin/users/invites/:id/revoke */
export default createAdminPostHandler(handleRevokeInvite, (query) => ({
  inviteId: readQueryParam(query, 'id'),
}))
