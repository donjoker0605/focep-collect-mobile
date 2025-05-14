// src/screens/Auth/LoginScreenAdapter.js
import LoginScreen from './LoginScreen'; // ✅ Import par défaut

// Adaptateur simple pour éviter les erreurs de navigation
export default function LoginScreenAdapter(props) {
  return <LoginScreen {...props} />;
}