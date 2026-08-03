import { auth } from "@/auth";

export default async function AuthTestPage() {
  const session = await auth();

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", color: "black", backgroundColor: "white", minHeight: "100vh" }}>
      <h1>Auth.js Session Test (Server Component)</h1>
      <div style={{ margin: "20px 0", padding: "20px", backgroundColor: "#f0f0f0", borderRadius: "8px" }}>
        <h2>Session Data:</h2>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>
      <p>
        If you see <strong>user.id</strong> and <strong>user.role</strong> in the JSON above, the session augmentation is working!
      </p>
    </div>
  );
}
