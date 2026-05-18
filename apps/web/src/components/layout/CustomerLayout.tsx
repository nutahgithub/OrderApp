import { Outlet } from "react-router-dom";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { ThemeSwitcher } from "../ui/ThemeSwitcher";

export const CustomerLayout = () => {
  return (
    <main className="min-h-screen bg-background p-[18px]">
      <div className="mx-auto mb-3 flex w-[min(520px,100%)] justify-end gap-2.5">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
      <Outlet />
    </main>
  );
};
