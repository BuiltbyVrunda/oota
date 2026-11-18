import { Outlet } from 'react-router-dom'
import type { PortalRole } from '../../api/portal'
import { PortalAuthProvider } from '../../context/PortalAuthContext'

/** Each portal has its own session (cookie + account table), so each route subtree gets its own provider. */
export function PortalRoute({ role }: { role: PortalRole }) {
  return <PortalAuthProvider role={role}><Outlet /></PortalAuthProvider>
}
