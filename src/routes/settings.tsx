import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDarkMode } from "@/hooks/use-dark-mode";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — StatusServer" },
      { name: "description", content: "Configure monitoring intervals and account preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [isDark, setIsDark] = useDarkMode();

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure your monitoring preferences.</p>
      </div>

      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">General</h2>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="workspace">Workspace Name</Label>
            <Input id="workspace" defaultValue="My Workspace" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="interval">Check Interval (seconds)</Label>
            <Input id="interval" type="number" defaultValue={60} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timeout">Timeout (seconds)</Label>
            <Input id="timeout" type="number" defaultValue={30} />
          </div>
        </div>
      </Card>

      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Notifications</h2>
        <div className="space-y-4">
          <ToggleRow label="Email alerts" description="Send alerts to configured email addresses." defaultChecked />
          <ToggleRow label="Webhook alerts" description="POST events to your webhook endpoints." defaultChecked />
          <ToggleRow label="Daily summary" description="Get a daily status digest at 9:00 AM." defaultChecked />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Appearance</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-foreground">Dark mode</p>
              <p className="text-xs text-muted-foreground">Use dark color theme.</p>
            </div>
            <Switch checked={isDark} onCheckedChange={setIsDark} />
          </div>
          <ToggleRow label="Compact view" description="Reduce spacing in dashboard list." defaultChecked />
        </div>
        <div className="mt-6 flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </Card>
    </AppShell>
  );
}

function ToggleRow({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
