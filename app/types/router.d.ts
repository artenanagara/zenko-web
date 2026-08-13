import type { Role } from '#shared/types/user'

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * Roles allowed on this route. Read by the `auth` middleware; a route
     * that sets it must also list that middleware, or nothing is enforced.
     */
    roles?: Role[]
  }
}

export {}
