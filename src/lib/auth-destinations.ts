export function safeAuthDestination(value: string | null) {
  return value === "/reset-password" ? value : "/dashboard";
}
