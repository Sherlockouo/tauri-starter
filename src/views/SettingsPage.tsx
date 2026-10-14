/** Settings — profile form, notification switches, appearance and danger zone. */
import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Form,
  Input,
  Label,
  Modal,
  NumberField,
  Separator,
  Switch,
  TextField,
  toast,
} from "@heroui/react";
import { useTheme } from "@heroui/react";
import { useDashboard } from "../store/dashboard";
import { Avatar } from "@heroui/react";
import { Skeleton } from "@heroui/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { isDesktop } from "../lib/platform";

export function SettingsPage() {
  const status = useDashboard((s) => s.status);
  const appInfo = useDashboard((s) => s.appInfo);
  const { resolvedTheme, setTheme } = useTheme("system");
  const live = useDashboard((s) => s.live);
  const setLive = useDashboard((s) => s.setLive);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [displayName, setDisplayName] = useState("Alex Chen");
  const [email, setEmail] = useState("alex@acme.io");
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [digestHour, setDigestHour] = useState(9);

  if (status !== "ready") {
    return (
      <Card className="p-5">
        <Skeleton className="h-80 w-full rounded-lg" />
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Profile */}
      <Card className="gap-4 p-5">
        <CardHeader className="px-0 pt-0">
          <div>
            <CardTitle className="text-sm">Profile</CardTitle>
            <p className="text-muted text-xs">How you appear across the workspace</p>
          </div>
        </CardHeader>

        <Form
          className="gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Profile saved");
          }}
        >
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <Avatar.Fallback className="text-lg">AC</Avatar.Fallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-foreground text-sm font-medium">{displayName}</p>
              <p className="text-muted text-xs">PNG or JPG, 2 MB max — avatar upload is a stub</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField isRequired value={displayName} onChange={setDisplayName}>
              <Label>Display name</Label>
              <Input />
            </TextField>
            <TextField isRequired type="email" value={email} onChange={setEmail}>
              <Label>Email</Label>
              <Input />
            </TextField>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </div>
        </Form>
      </Card>

      {/* Notifications */}
      <Card className="gap-3 p-5">
        <div>
          <h2 className="text-foreground text-sm font-semibold">Notifications</h2>
          <p className="text-muted text-xs">Choose what you want to hear about</p>
        </div>

        <div className="divide-y divide-separator">
          <SwitchRow
            label="Live data"
            description="New metrics and events stream in automatically — no refresh needed."
            isSelected={live}
            onChange={setLive}
          />
          <SwitchRow
            label="Weekly digest"
            description="A summary of key metrics every Monday morning."
            isSelected={weeklyDigest}
            onChange={setWeeklyDigest}
          />
          {weeklyDigest && (
            <NumberField
              aria-label="Digest hour"
              value={digestHour}
              onChange={setDigestHour}
              minValue={0}
              maxValue={23}
              className="max-w-48 py-3"
            >
              <Label>Digest hour (0–23)</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>
          )}
          <SwitchRow
            label="Payment alerts"
            description="Failed payments and dunning events, in real time."
            isSelected={paymentAlerts}
            onChange={setPaymentAlerts}
          />
          <SwitchRow
            label="Product updates"
            description="Occasional news about new features."
            isSelected={productUpdates}
            onChange={setProductUpdates}
          />
        </div>
      </Card>

      {/* Appearance + runtime */}
      <Card className="gap-4 p-5">
        <div>
          <h2 className="text-foreground text-sm font-semibold">Appearance</h2>
          <p className="text-muted text-xs">Theme is persisted via HeroUI's useTheme hook</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "light", label: "Light", icon: Sun },
              { key: "dark", label: "Dark", icon: Moon },
              { key: "system", label: "System", icon: Monitor },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={resolvedTheme === key ? "primary" : "secondary"}
              size="sm"
              onPress={() => setTheme(key)}
            >
              <Icon className="size-3.5" />
              {label}
            </Button>
          ))}
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Runtime", isDesktop() ? "Tauri" : "Browser"],
            ["App version", appInfo?.version ?? "0.1.0"],
            ["Webview", appInfo?.webview ?? "—"],
            ["Platform", appInfo?.platform ?? "web"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-muted text-xs">{label}</p>
              <p className="text-foreground text-sm font-medium capitalize">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-danger/40 gap-3 p-5">
        <div>
          <h2 className="text-danger text-sm font-semibold">Danger zone</h2>
          <p className="text-muted text-xs">Irreversible actions — think twice</p>
        </div>
        <div>
          <Button variant="danger" onPress={() => setDeleteOpen(true)}>
            Delete workspace
          </Button>
        </div>

        {deleteOpen && (
        <Modal isOpen onOpenChange={setDeleteOpen}>
          <Modal.Backdrop>
            <Modal.Container>
              {/* role="alertdialog" keeps the explicit-action semantics of a confirm dialog */}
              <Modal.Dialog role="alertdialog" className="sm:max-w-sm">
                <Modal.Header>
                  <Modal.Heading>Delete this workspace?</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p>
                    All dashboards, customers and billing history will be permanently removed. This
                    action cannot be undone.
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onPress={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onPress={() => {
                      setDeleteOpen(false);
                      setTimeout(() => toast.danger("Workspace deletion is disabled in the template"), 0);
                    }}
                  >
                    Delete forever
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
        )}
      </Card>
    </div>
  );
}

function SwitchRow(props: {
  label: string;
  description: string;
  isSelected: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Switch isSelected={props.isSelected} onChange={props.onChange} className="w-full py-3">
      <Switch.Content className="w-full flex-row items-start gap-3">
        <Switch.Control className="mt-0.5 shrink-0">
          <Switch.Thumb />
        </Switch.Control>
        <div className="min-w-0">
          <p className="text-foreground text-sm font-medium">{props.label}</p>
          <p className="text-muted text-xs">{props.description}</p>
        </div>
      </Switch.Content>
    </Switch>
  );
}
