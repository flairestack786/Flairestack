import { createAdminPostHandler, readQueryParam } from '../../../../server/lib/vercelAdminHandler.mjs'
import { handleResetPassword } from '../../../../server/lib/adminUsersHandlers.mjs'

/** POST /api/admin/users/:id/reset-password */
export default createAdminPostHandler(handleResetPassword, (query) => ({
  userId: readQueryParam(query, 'id'),
}))
