import { createAdminPostHandler, readQueryParam } from '../../../../server/lib/vercelAdminHandler.mjs'
import { handleDisableUser } from '../../../../server/lib/adminUsersHandlers.mjs'

/** POST /api/admin/users/:id/disable */
export default createAdminPostHandler(handleDisableUser, (query) => ({
  userId: readQueryParam(query, 'id'),
}))
