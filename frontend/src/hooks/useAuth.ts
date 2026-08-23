import { createContext, useContext } from "react"

type AuthState = {
  isAuthenticated: boolean
  isAdmin: boolean
  user: { id: number; email: string; role: string } | null
  logout: () => void
}

export const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}
