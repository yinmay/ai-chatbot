import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { getMessageCountByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const userType: UserType = session.user.type;
  const maxMessages = entitlementsByUserType[userType].maxMessagesPerDay;

  const usedMessages = await getMessageCountByUserId({
    id: session.user.id,
    differenceInHours: 24,
  });

  return Response.json({
    used: usedMessages,
    limit: maxMessages,
    remaining: Math.max(0, maxMessages - usedMessages),
    userType,
  });
}
