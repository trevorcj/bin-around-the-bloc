import supabase from "../services/supabase";

export default async function updateUserProfile(currentEmail, updates) {
  if (!currentEmail) {
    throw new Error("Missing account identifier.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("email", currentEmail)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Unable to update your profile.");
  }

  return data ?? null;
}

