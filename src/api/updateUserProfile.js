import manta from "../services/manta";

export default async function updateUserProfile(currentEmail, updates) {
  if (!currentEmail) {
    throw new Error("Missing account identifier.");
  }

  const response = await manta.updateRecords({
    table: "batb-users",
    where: { email: currentEmail },
    data: updates,
  });

  const payload = response?.data ?? response;

  if (payload?.status === false || payload?.success === false) {
    throw new Error(payload?.message || "Unable to update your profile.");
  }

  return payload?.data ?? payload ?? null;
}
