import { ResetPasswordForm } from "./ResetPasswordForm";

interface ResetPasswordPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { error } = await searchParams;
  const initialError = error === "invalid-link"
    ? "Tautan pengaturan ulang kata sandi tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru."
    : "";

  return <ResetPasswordForm initialError={initialError} />;
}
