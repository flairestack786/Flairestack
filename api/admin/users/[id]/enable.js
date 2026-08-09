import { createAdminPostHandler, readQueryParam } from '../../../../server/lib/vercelAdminHandler.mjs'
import { handleEnableUser } from '../../../../server/lib/adminUsersHandlers.mjs'

/** POST /api/admin/users/:id/enable */
export default createAdminPostHandler(handleEnableUser, (query) => ({
  userId: readQueryParam(query, 'id'),
}))
