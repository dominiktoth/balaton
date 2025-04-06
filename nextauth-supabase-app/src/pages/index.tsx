import { useSession } from "next-auth/react";
import AuthButton from "../components/AuthButton";

const Home = () => {
  const { data: session } = useSession();

  return (
    <div>
      <h1>Welcome to the NextAuth with Supabase App</h1>
      {session ? (
        <div>
          <p>Signed in as {session.user.email}</p>
          <AuthButton />
        </div>
      ) : (
        <div>
          <p>You are not signed in.</p>
          <AuthButton />
        </div>
      )}
    </div>
  );
};

export default Home;