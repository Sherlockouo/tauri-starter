/** Add-customer form in a modal — demonstrates HeroUI form primitives + toast. */
import { useState } from "react";
import {
  Button,
  Form,
  Input,
  Label,
  Modal,
  Select,
  ListBox,
  TextField,
  toast,
} from "@heroui/react";
import { useUi } from "../store/ui";

const FORM_ID = "add-customer-form";

export function AddCustomerModal() {
  const open = useUi((s) => s.addCustomerOpen);
  const setOpen = useUi((s) => s.setAddCustomerOpen);
  if (!open) return null;
  return <AddCustomerForm onClose={() => setOpen(false)} />;
}

function AddCustomerForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<string | null>("pro");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Template stub — replace with a real mutation.
    setTimeout(() => {
      onClose();
      toast.success("Customer invited", {
        description: `${name || "New customer"} will receive an email invitation.`,
      });
    }, 600);
  };

  return (
    <Modal isOpen onOpenChange={onClose}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.Header>
              <Modal.Heading>Add customer</Modal.Heading>
              <p className="text-muted text-sm">Invite a customer to the workspace.</p>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleSubmit} id={FORM_ID} className="gap-4">
                <TextField isRequired value={name} onChange={setName} autoComplete="off">
                  <Label>Full name</Label>
                  <Input placeholder="Jane Cooper" />
                </TextField>

                <TextField isRequired type="email" value={email} onChange={setEmail}>
                  <Label>Email</Label>
                  <Input placeholder="jane@company.com" />
                </TextField>

                <Select
                  aria-label="Plan"
                  selectedKey={plan}
                  onSelectionChange={(key) => setPlan((key as string) ?? null)}
                >
                  <Label>Plan</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="starter" textValue="Starter">
                        Starter
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="pro" textValue="Pro">
                        Pro
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="enterprise" textValue="Enterprise">
                        Enterprise
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">
                Cancel
              </Button>
              <Button type="submit" form={FORM_ID} isDisabled={submitting}>
                {submitting ? "Inviting…" : "Send invite"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
