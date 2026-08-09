import { Router } from 'express'
import {
  requireAdministrator,
  requireAuthenticatedUser,
} from '../middleware/requireAdministrator.mjs'
import {
  handleAcceptInvite,
  handleDisableUser,
  handleEnableUser,
  handleInviteUser,
  handleResendInvite,
  handleResetPassword,
  handleRevokeInvite,
  handleUpdateUserRole,
} from '../lib/adminUsersHandlers.mjs'

const router = Router()

/**
 * @param {import('express').Response} res
 * @param {{ status: number, body: Record<string, unknown> }} result
 */
function sendResult(res, result) {
  return res.status(result.status).json(result.body)
}

router.post('/users/invite', requireAdministrator, async (req, res) => {
  return sendResult(
    res,
    await handleInviteUser({
      body: req.body ?? {},
      adminProfile: req.adminProfile,
    })
  )
})

router.post('/users/invites/accept', requireAuthenticatedUser, async (req, res) => {
  return sendResult(
    res,
    await handleAcceptInvite({
      authUser: req.authUser,
    })
  )
})

router.post('/users/invites/:inviteId/resend', requireAdministrator, async (req, res) => {
  return sendResult(
    res,
    await handleResendInvite({
      params: { inviteId: req.params.inviteId },
      adminProfile: req.adminProfile,
    })
  )
})

router.post('/users/invites/:inviteId/revoke', requireAdministrator, async (req, res) => {
  return sendResult(
    res,
    await handleRevokeInvite({
      params: { inviteId: req.params.inviteId },
      adminProfile: req.adminProfile,
    })
  )
})

router.post('/users/:userId/disable', requireAdministrator, async (req, res) => {
  return sendResult(
    res,
    await handleDisableUser({
      params: { userId: req.params.userId },
      adminProfile: req.adminProfile,
    })
  )
})

router.post('/users/:userId/enable', requireAdministrator, async (req, res) => {
  return sendResult(
    res,
    await handleEnableUser({
      params: { userId: req.params.userId },
      adminProfile: req.adminProfile,
    })
  )
})

router.post('/users/:userId/role', requireAdministrator, async (req, res) => {
  return sendResult(
    res,
    await handleUpdateUserRole({
      body: req.body ?? {},
      params: { userId: req.params.userId },
      adminProfile: req.adminProfile,
    })
  )
})

router.post('/users/:userId/reset-password', requireAdministrator, async (req, res) => {
  return sendResult(
    res,
    await handleResetPassword({
      params: { userId: req.params.userId },
      adminProfile: req.adminProfile,
    })
  )
})

export default router
