import { User, Mail, Shield } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
        Profile
      </h1>
      <p className="text-zinc-500 mb-8">Manage your account and settings.</p>

      <div className="max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
            <User className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xl font-semibold text-zinc-900 dark:text-white">
              Player One
            </p>
            <p className="text-sm text-zinc-500">Member since 2025</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <Mail className="h-4 w-4 text-zinc-400" />
            player@example.com
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <Shield className="h-4 w-4 text-zinc-400" />
            Role: Player
          </div>
        </div>

        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950 p-4">
          <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            SAPS Balance
          </p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            500 SAPS
          </p>
        </div>
      </div>
    </div>
  );
}
