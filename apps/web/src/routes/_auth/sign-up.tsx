import { createFileRoute } from '@tanstack/react-router'
import SignUpPage from '~/features/auth/view/sign-up-page'

export const Route = createFileRoute('/_auth/sign-up')({
  component: SignUpPage,
})
