import supabase from "../services/supabase";

// 1. Estate Code Validation for Resident Registration
export async function validateEstateCode(code) {
  if (!code || !code.trim()) {
    return { valid: false, message: "Please enter an estate code." };
  }

  const cleanCode = code.trim().toUpperCase();

  const { data: estate, error } = await supabase
    .from("estates")
    .select("id, name, code, description, location")
    .ilike("code", cleanCode)
    .maybeSingle();

  if (error || !estate) {
    return {
      valid: false,
      message: "Estate code not found. Check the code and try again.",
    };
  }

  // Fetch active streets and active property types for this estate
  const [streetsRes, propertyTypesRes] = await Promise.all([
    supabase
      .from("streets")
      .select("id, name")
      .eq("estate_id", estate.id)
      .eq("is_archived", false)
      .order("name", { ascending: true }),
    supabase
      .from("property_types")
      .select("id, name, fee")
      .eq("estate_id", estate.id)
      .eq("is_archived", false)
      .order("fee", { ascending: true }),
  ]);

  return {
    valid: true,
    estate,
    streets: streetsRes.data || [],
    propertyTypes: propertyTypesRes.data || [],
  };
}

// 2. Estate Overview Metrics
export async function getEstateOverview(estateId) {
  if (!estateId) return null;

  const [residentsRes, paymentsRes, billsRes, recentPaymentsRes] = await Promise.all([
    // Total residents
    supabase
      .from("profiles")
      .select("id, opening_balance", { count: "exact" })
      .eq("estate_id", estateId)
      .eq("role", "resident"),

    // Total payments & collected sum
    supabase
      .from("payments")
      .select("amount, status", { count: "exact" })
      .eq("estate_id", estateId)
      .eq("status", "Successful"),

    // Unpaid bills for outstanding calculation
    supabase
      .from("bills")
      .select("amount, status")
      .eq("estate_id", estateId)
      .eq("status", "Unpaid"),

    // Recent 5 payments
    supabase
      .from("payments")
      .select("*")
      .eq("estate_id", estateId)
      .order("createdat", { ascending: false })
      .limit(5),
  ]);

  const totalResidents = residentsRes.count || 0;
  const residentsList = residentsRes.data || [];
  const openingBalanceTotal = residentsList.reduce(
    (acc, r) => acc + (Number(r.opening_balance) || 0),
    0
  );

  const totalPayments = paymentsRes.count || 0;
  const successfulPayments = paymentsRes.data || [];
  const totalCollected = successfulPayments.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );

  const unpaidBills = billsRes.data || [];
  const unpaidBillsTotal = unpaidBills.reduce(
    (acc, b) => acc + (Number(b.amount) || 0),
    0
  );

  const totalOutstanding = unpaidBillsTotal + openingBalanceTotal;

  return {
    totalResidents,
    totalPayments,
    totalCollected,
    totalOutstanding,
    recentPayments: recentPaymentsRes.data || [],
  };
}

// 3. Estate Residents List with Search & Filters
export async function getEstateResidents(estateId, {
  search = "",
  streetId = "all",
  propertyTypeId = "all",
  page = 1,
  limit = 10,
} = {}) {
  if (!estateId) return { data: [], total: 0, totalPages: 1 };

  let query = supabase
    .from("profiles")
    .select(`
      id,
      fullname,
      email,
      phone,
      housenumber,
      streetname,
      apartment,
      street_id,
      property_type_id,
      property_type_name,
      opening_balance,
      status,
      created_at
    `, { count: "exact" })
    .eq("estate_id", estateId)
    .eq("role", "resident");

  if (streetId && streetId !== "all") {
    query = query.eq("street_id", streetId);
  }

  if (propertyTypeId && propertyTypeId !== "all") {
    query = query.eq("property_type_id", propertyTypeId);
  }

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(
      `fullname.ilike.%${term}%,email.ilike.%${term}%,housenumber.ilike.%${term}%,streetname.ilike.%${term}%`
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data: residents, count, error } = await query;

  if (error) {
    console.error("Error fetching estate residents:", error);
    throw new Error(error.message);
  }

  // For each resident, calculate their current fee and outstanding bills
  const residentIds = (residents || []).map((r) => r.id);
  let unpaidBillsByResident = {};

  if (residentIds.length > 0) {
    const { data: unpaidBills } = await supabase
      .from("bills")
      .select("resident_id, amount")
      .in("resident_id", residentIds)
      .eq("status", "Unpaid");

    if (unpaidBills) {
      unpaidBills.forEach((b) => {
        unpaidBillsByResident[b.resident_id] =
          (unpaidBillsByResident[b.resident_id] || 0) + Number(b.amount || 0);
      });
    }
  }

  const enhancedResidents = (residents || []).map((r) => {
    const unpaidAmount = unpaidBillsByResident[r.id] || 0;
    const openingBal = Number(r.opening_balance || 0);
    return {
      ...r,
      totalOutstanding: unpaidAmount + openingBal,
    };
  });

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data: enhancedResidents,
    total,
    totalPages,
    itemsPerPage: limit,
  };
}

// 4. Resident Detail View (Profile, Bills, and Payments)
export async function getResidentDetails(residentId) {
  if (!residentId) return null;

  const [profileRes, billsRes, paymentsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", residentId)
      .single(),
    supabase
      .from("bills")
      .select("*")
      .eq("resident_id", residentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("*")
      .eq("resident_id", residentId)
      .order("createdat", { ascending: false }),
  ]);

  if (profileRes.error) {
    throw new Error(profileRes.error.message);
  }

  return {
    profile: profileRes.data,
    bills: billsRes.data || [],
    payments: paymentsRes.data || [],
  };
}

// 5. Update Resident Opening Balance
export async function updateResidentOpeningBalance(residentId, balance) {
  if (!residentId) throw new Error("Missing resident ID.");

  const num = Number(balance) || 0;
  const { data, error } = await supabase
    .from("profiles")
    .update({ opening_balance: num })
    .eq("id", residentId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// 6. Estate Payments Central Ledger
export async function getEstatePayments(estateId, {
  search = "",
  status = "all",
  month = "all",
  page = 1,
  limit = 10,
} = {}) {
  if (!estateId) return { data: [], total: 0, totalPages: 1 };

  let query = supabase
    .from("payments")
    .select("*", { count: "exact" })
    .eq("estate_id", estateId);

  if (status && status !== "all") {
    query = query.ilike("status", status);
  }

  if (month && month !== "all") {
    query = query.ilike("month", month);
  }

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(
      `receiptid.ilike.%${term}%,fullname.ilike.%${term}%,email.ilike.%${term}%,reference.ilike.%${term}%,address.ilike.%${term}%`
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.order("createdat", { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching estate payments:", error);
    throw new Error(error.message);
  }

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data: data || [],
    total,
    totalPages,
    itemsPerPage: limit,
  };
}

// 7. Record Manual Payment
export async function recordManualPayment({
  estateId,
  residentId,
  amount,
  month,
  year,
  paymentMethod = "Bank Transfer",
  reference = "",
  paymentDate = new Date().toISOString(),
}) {
  if (!estateId || !residentId || !amount) {
    throw new Error("Missing required payment fields.");
  }

  // Get resident details
  const { data: resident, error: resError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", residentId)
    .single();

  if (resError || !resident) {
    throw new Error("Resident not found.");
  }

  const receiptid = `MAN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // Find any unpaid bill for this resident and month/year
  let billId = null;
  const { data: matchingBill } = await supabase
    .from("bills")
    .select("id")
    .eq("resident_id", residentId)
    .ilike("month", month)
    .eq("year", String(year))
    .eq("status", "Unpaid")
    .maybeSingle();

  if (matchingBill) {
    billId = matchingBill.id;
  }

  const paymentRecord = {
    receiptid,
    estate_id: estateId,
    resident_id: residentId,
    bill_id: billId,
    email: resident.email,
    fullname: resident.fullname,
    address: `${resident.housenumber ? `House ${resident.housenumber}, ` : ""}${resident.streetname || ""}`,
    amount: Number(amount),
    totalPaid: Number(amount),
    month: month.toLowerCase(),
    year: String(year),
    status: "Successful",
    paymentMethod,
    reference: reference.trim() || `MAN_REF_${Date.now()}`,
    recorded_by: "Admin",
    createdat: paymentDate,
  };

  const { data: createdPayment, error: insertError } = await supabase
    .from("payments")
    .insert([paymentRecord])
    .select()
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  // Mark bill as Paid if one was found or create a paid bill record for reconciliation
  if (billId) {
    await supabase
      .from("bills")
      .update({ status: "Paid", paid_at: paymentDate })
      .eq("id", billId);
  } else {
    try {
      await supabase.from("bills").insert([
        {
          estate_id: estateId,
          resident_id: residentId,
          month: month.toLowerCase(),
          year: String(year),
          amount: Number(amount),
          description: `${month.charAt(0).toUpperCase() + month.slice(1)} Waste Collection`,
          status: "Paid",
          paid_at: paymentDate,
        },
      ]);
    } catch (e) {
      console.warn("Could not insert reconciled bill:", e);
    }
  }

  return createdPayment;
}

// 8. Estate Streets Configuration
export async function getEstateStreets(estateId, includeArchived = true) {
  if (!estateId) return [];

  let query = supabase
    .from("streets")
    .select("*")
    .eq("estate_id", estateId);

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createStreet(estateId, name) {
  if (!estateId || !name?.trim()) throw new Error("Street name is required.");

  const { data, error } = await supabase
    .from("streets")
    .insert([{ estate_id: estateId, name: name.trim(), is_archived: false }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateStreet(streetId, updates) {
  if (!streetId) throw new Error("Missing street ID.");

  const { data, error } = await supabase
    .from("streets")
    .update(updates)
    .eq("id", streetId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 9. Estate Property Types & Snapshot-Safe Fee Configuration
export async function getEstatePropertyTypes(estateId, includeArchived = true) {
  if (!estateId) return [];

  let query = supabase
    .from("property_types")
    .select("*")
    .eq("estate_id", estateId);

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query.order("fee", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createPropertyType(estateId, name, fee) {
  if (!estateId || !name?.trim()) throw new Error("Property type name is required.");

  const numFee = Number(fee) >= 0 ? Number(fee) : 5000;

  const { data, error } = await supabase
    .from("property_types")
    .insert([
      {
        estate_id: estateId,
        name: name.trim(),
        fee: numFee,
        is_archived: false,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePropertyType(propertyTypeId, updates) {
  if (!propertyTypeId) throw new Error("Missing property type ID.");

  const { data, error } = await supabase
    .from("property_types")
    .update(updates)
    .eq("id", propertyTypeId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 10. Estate Settings
export async function getEstateSettings(estateId) {
  if (!estateId) return null;

  const { data, error } = await supabase
    .from("estates")
    .select("*")
    .eq("id", estateId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateEstateSettings(estateId, updates) {
  if (!estateId) throw new Error("Missing estate ID.");

  const { data, error } = await supabase
    .from("estates")
    .update(updates)
    .eq("id", estateId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
