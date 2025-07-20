import AuthForm from "../components/AuthForm";

export default function LoginClient() {
  return (
    <AuthForm
  title="Connexion"
  role="client"
  redirectTo="/dashboard" // 👈 ici au lieu de "/formulaire"
  colorTheme="blue"
/>

  );
}
