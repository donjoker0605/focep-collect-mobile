import { LoginScreen } from './LoginScreen';

// Adaptateur simple pour éviter les erreurs de navigation
export default function LoginScreenAdapter(props) {
  return <LoginScreen {...props} />;
}