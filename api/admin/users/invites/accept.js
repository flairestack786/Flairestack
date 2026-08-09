import { createAuthenticatedPostHandler } from '../../../../server/lib/vercelAdminHandler.mjs'
import { handleAcceptInvite } from '../../../../server/lib/adminUsersHandlers.mjs'

/** POST /api/admin/users/invites/accept */
export default createAuthenticatedPostHandler(handleAcceptInvite)
