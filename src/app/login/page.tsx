import { LoginForm } from "@/components/LoginForm";

interface LoginPageProps {
  searchParams?: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <LoginForm nextPath={params?.next} />
    </div>
  );
}
