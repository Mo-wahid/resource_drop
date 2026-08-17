import { RequestStatus } from "@prisma/client";

export const statusColors: Record<RequestStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",

  PROVISIONED: "bg-green-500/10 text-green-500 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  REVOKED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};
