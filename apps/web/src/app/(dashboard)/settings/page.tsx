"use client";

import { UserProfile } from "@clerk/nextjs";
import { Key, Terminal } from "lucide-react";
import { ApiKeysSettings } from "@/features/settings/components/api-keys-settings";
import { CliTokenSettings } from "@/features/settings/components/cli-token-settings";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10 flex justify-center">
      <UserProfile routing="hash">
        <UserProfile.Page
          label="API Keys"
          labelIcon={<Key className="h-4 w-4" />}
          url="api-keys"
        >
          <ApiKeysSettings />
        </UserProfile.Page>
        <UserProfile.Page
          label="CLI"
          labelIcon={<Terminal className="h-4 w-4" />}
          url="cli"
        >
          <CliTokenSettings />
        </UserProfile.Page>
      </UserProfile>
    </div>
  );
}

