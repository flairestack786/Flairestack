import { createAdminPostHandler, readQueryParam } from '../../../../../server/lib/vercelAdminHandler.mjs'
import { handleResendInvite } from '../../../../../server/lib/adminUsersHandlers.mjs'

/** POST /api/admin/users/invites/:id/resend */
export default createAdminPostHandler(handleResendInvite, (query) => ({
  inviteId: readQueryParam(query, 'id'),
}))
