"use client";

import { ProfileForm, type ClientUser } from "./ProfileForm";

interface PersonalDetailsProps {
  user: ClientUser;
  refreshUser: () => Promise<void>;
}

export function PersonalDetails({ user, refreshUser }: PersonalDetailsProps) {
  return (
    <ProfileForm
      user={user}
      onSuccess={refreshUser}
    />
  );
}
