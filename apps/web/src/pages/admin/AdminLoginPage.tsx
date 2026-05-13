import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export const AdminLoginPage = () => {
  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">Admin</p>
        <h1>Sign in</h1>
        <form className="form-stack">
          <Input label="Email" name="email" type="email" placeholder="admin@example.com" />
          <Input label="Password" name="password" type="password" placeholder="Password" />
          <Button type="button">Continue</Button>
        </form>
      </section>
    </main>
  );
};

