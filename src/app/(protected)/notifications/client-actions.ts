"use server";

import { requireAuthAction } from "@/lib/auth/guard";
import { getNotifications } from "./queries";

export async function getNotificationsAction() {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session) {
    return [];
  }

  const notifications = await getNotifications(authResult.session.user.id);
  return notifications;
}
