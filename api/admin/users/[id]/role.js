import { createAdminPostHandler, readQueryParam } from '../../../../server/lib/vercelAdminHandler.mjs'
import { handleUpdateUserRole } from '../../../../server/lib/adminUsersHandlers.mjs'

/** POST /api/admin/users/:id/role */
export default createAdminPostHandler(handleUpdateUserRole, (query) => ({
  userId: readQueryParam(query, 'id'),
}))
