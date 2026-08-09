import { createAdminPostHandler } from '../../../server/lib/vercelAdminHandler.mjs'
import { handleInviteUser } from '../../../server/lib/adminUsersHandlers.mjs'

/** POST /api/admin/users/invite */
export default createAdminPostHandler(handleInviteUser)
