/** Avatar + account dropdown in the topbar. */
import { Dropdown, Label, Separator } from "@heroui/react";
import { Avatar, Badge } from "@heroui/react";
import { Button, Kbd } from "@heroui/react";
import { CircleUser, CreditCard, LogOut, Settings } from "lucide-react";
import { useUi } from "../../store/ui";
import { toast } from "@heroui/react";

export function UserMenu() {
  const setPage = useUi((s) => s.setPage);

  return (
    <Dropdown>
      <Button aria-label="Account menu" variant="ghost" className="h-9 gap-2 px-2">
        <Avatar size="sm">
          <Avatar.Fallback>AC</Avatar.Fallback>
        </Avatar>
        <span className="text-foreground hidden text-sm font-medium sm:inline">Alex Chen</span>
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          onAction={(key) => {
            if (key === "settings") setPage("settings");
            else if (key === "signout") toast.success("Signed out — see you soon!");
            else if (key === "billing") toast.info("Opening billing portal…");
            else toast.info("Profile editor is a template stub");
          }}
        >
          <Dropdown.Section>
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar size="sm">
                <Avatar.Fallback>AC</Avatar.Fallback>
              </Avatar>
              <div className="flex flex-col leading-tight">
                <span className="text-foreground text-sm font-medium">Alex Chen</span>
                <span className="text-muted text-xs">alex@acme.io</span>
              </div>
              <Badge color="accent" size="sm" className="ml-auto">
                Pro
              </Badge>
            </div>
          </Dropdown.Section>
          <Separator />
          <Dropdown.Item id="profile" textValue="Profile">
            <CircleUser className="size-4" />
            <Label>Profile</Label>
          </Dropdown.Item>
          <Dropdown.Item id="billing" textValue="Billing">
            <CreditCard className="size-4" />
            <Label>Billing</Label>
            <Kbd slot="keyboard">
              <Kbd.Abbr keyValue="command" />
              <Kbd.Content>B</Kbd.Content>
            </Kbd>
          </Dropdown.Item>
          <Dropdown.Item id="settings" textValue="Settings">
            <Settings className="size-4" />
            <Label>Settings</Label>
          </Dropdown.Item>
          <Separator />
          <Dropdown.Item id="signout" textValue="Sign out" variant="danger">
            <LogOut className="size-4" />
            <Label>Sign out</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
