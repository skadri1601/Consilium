"use client";

import { UserProfile } from "@clerk/nextjs";
import { Key, Terminal, Settings } from "lucide-react";
import { ApiKeysSettings } from "@/features/settings/components/api-keys-settings";
import { CliTokenSettings } from "@/features/settings/components/cli-token-settings";
import { PreferencesSettings } from "@/features/settings/components/preferences-settings";
import { PageHeader } from "@/components/shared/page-header";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title={
          <>
            Tune the <em className="not-italic text-warm">workspace.</em>
          </>
        }
        description="Manage profile, API keys, CLI tokens, and Council preferences."
      />
      <div className="px-6 lg:px-8 py-8 flex justify-center">
        <UserProfile routing="hash">
          <UserProfile.Page
            label="Preferences"
            labelIcon={<Settings className="h-4 w-4" />}
            url="preferences"
          >
            <PreferencesSettings />
          </UserProfile.Page>
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
    </>
  );
}
