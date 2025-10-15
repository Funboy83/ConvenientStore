
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage application-wide settings."
      />
      <Card>
        <CardHeader>
          <CardTitle>Manage Units & Attributes</CardTitle>
          <CardDescription>
            This section will allow you to create and manage reusable units (e.g., box, can) and attributes (e.g., color, size) for your products. This feature is coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Coming soon...</p>
        </CardContent>
      </Card>
    </>
  );
}
