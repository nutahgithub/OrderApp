import { Outlet } from "react-router-dom";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { ThemeSwitcher } from "../ui/ThemeSwitcher";

export const CustomerLayout = () => {
  return (
    <main className="min-h-screen bg-background px-3 py-4">
      <div className="mx-auto mb-3 grid w-[min(520px,100%)] grid-cols-2 gap-2.5">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
      <Outlet />
    </main>
  );
};
