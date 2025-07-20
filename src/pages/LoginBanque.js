import AuthForm from "../components/AuthForm";

export default function LoginBanque() {
  return (
    <AuthForm
      title="Connexion banque"
      role="banque"
      redirectTo="/banque"
      colorTheme="green"
    />
  );
}
