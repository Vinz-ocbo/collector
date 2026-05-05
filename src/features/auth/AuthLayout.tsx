import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
