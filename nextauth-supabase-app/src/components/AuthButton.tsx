import { signIn, signOut, useSession } from "next-auth/react";

const AuthButton = () => {
  const { data: session } = useSession();

  return (
    <button onClick={() => (session ? signOut() : signIn())}>
      {session ? "Sign out" : "Sign in"}
    </button>
  );
};

export default AuthButton;