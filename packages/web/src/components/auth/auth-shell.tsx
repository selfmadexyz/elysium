import { Card, CardContent, CardDescription, CardHeader } from '@frontend/components/ui/card';
import type { ReactNode } from 'react';

export function AuthShell({
  title,
  description,
  children,
}: Readonly<{ title: string; description: ReactNode; children: ReactNode }>) {
  return (
    <main id="main-content" className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <h1 className="text-base font-medium">{title}</h1>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
