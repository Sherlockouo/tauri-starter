/** Light / dark / system theme switcher — built on HeroUI's useTheme hook. */
import { Dropdown, Label } from "@heroui/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@heroui/react";
import { Button } from "@heroui/react";

const OPTIONS = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
] as const;

export function ThemeMenu() {
  const { theme, setTheme } = useTheme("system");

  return (
    <Dropdown>
      <Button
        isIconOnly
        aria-label="Change theme"
        variant="ghost"
        className="text-muted"
      >
        {theme === "light" ? <Sun className="size-4" /> : theme === "dark" ? <Moon className="size-4" /> : <Monitor className="size-4" />}
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu selectedKeys={[theme]} selectionMode="single" onAction={(key) => setTheme(String(key))}>
          {OPTIONS.map(({ key, label, icon: Icon }) => (
            <Dropdown.Item key={key} id={key} textValue={label}>
              <Icon className="size-4" />
              <Label>{label}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
