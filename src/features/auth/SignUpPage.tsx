import { supabase } from "@/lib/supabase";
import { useState } from "react";

export function SignUpPage() {
  const [mail, setEmail] = useState("");

  async function signUpNewUser() {
    const { data, error } = await supabase.auth.signUp({
      email: mail,
      password: "example-password",
      // options: {
      //   emailRedirectTo: 'https://example.com/welcome',
      // },
    });
    console.log("data: ", data);
    console.log("error: ", error);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "200px",
      }}
    >
      <h1 style={{ color: "white" }}>Sign Up</h1>
      <input
        placeholder="Fill you mail"
        // value={mail}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={signUpNewUser}>SIGN UP</button>
    </div>
  );
}
