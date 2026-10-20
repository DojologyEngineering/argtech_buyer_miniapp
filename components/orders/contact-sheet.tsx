"use client";

import * as React from "react";
import { MessageCircle, Phone } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { ARGTECH_CONTACT } from "@/lib/constants";
import { openTelegramLink } from "@/lib/telegram";

/** Contact options for ARG TECH: a Telegram chat link and a phone number. */
export function ContactButton({
  label = "Contact ARG TECH",
  variant = "primary",
  ...props
}: { label?: string } & Omit<ButtonProps, "onClick" | "children">) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} {...props}>
        <MessageCircle />
        {label}
      </Button>
      <Sheet open={open} onOpenChange={setOpen} title="Contact ARG TECH" description="We usually reply during working hours.">
        <ContactOptions />
      </Sheet>
    </>
  );
}

export function ContactOptions() {
  return (
    <div className="space-y-2.5">
      <Button block onClick={() => openTelegramLink(ARGTECH_CONTACT.telegramUrl)}>
        <MessageCircle />
        Message on Telegram ({ARGTECH_CONTACT.telegramHandle})
      </Button>
      <Button asChild variant="secondary" block>
        <a href={ARGTECH_CONTACT.phoneHref}>
          <Phone />
          Call {ARGTECH_CONTACT.phone}
        </a>
      </Button>
    </div>
  );
}
