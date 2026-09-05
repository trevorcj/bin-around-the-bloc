import supabase from "../services/supabase";

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

export async function getEstateOverview(estateId) {
  if (!estateId) return null;

  const [residentsRes, paymentsRes, billsRes, recentPaymentsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, opening_balance", { count: "exact" })
      .eq("estate_id", estateId)
      .eq("role", "resident"),

    supabase
      .from("payments")
      .select("amount, status", { count: "exact" })
      .eq("estate_id", estateId)
      .eq("status", "Successful"),

    supabase
      .from("bills")
      .select("amount, status")
      .eq("estate_id", estateId)
      .eq("status", "Unpaid"),

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

export async function getEstateResidents(estateId, {
  search = "",
  streetId = "all",
  propertyTypeId = "all",
  status = "all",
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

  if (status && status !== "all") {
    query = query.ilike("status", status);
  }

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

export async function updateResidentDetails(estateId, residentId, {
  fullname,
  phone,
  email,
  street_id,
  housenumber,
  apartment,
  property_type_id,
}) {
  if (!estateId || !residentId) throw new Error("Missing estate or resident ID.");

  const { data: resident, error: resErr } = await supabase
    .from("profiles")
    .select("id, estate_id, role")
    .eq("id", residentId)
    .eq("estate_id", estateId)
    .eq("role", "resident")
    .single();

  if (resErr || !resident) {
    throw new Error("Resident not found or unauthorized for this estate.");
  }

  let streetname = null;
  if (street_id) {
    const { data: street, error: streetErr } = await supabase
      .from("streets")
      .select("id, name")
      .eq("id", street_id)
      .eq("estate_id", estateId)
      .single();

    if (streetErr || !street) {
      throw new Error("Selected street does not belong to this estate.");
    }
    streetname = street.name;
  }

  let property_type_name = null;
  if (property_type_id) {
    const { data: propType, error: propErr } = await supabase
      .from("property_types")
      .select("id, name")
      .eq("id", property_type_id)
      .eq("estate_id", estateId)
      .single();

    if (propErr || !propType) {
      throw new Error("Selected property type does not belong to this estate.");
    }
    property_type_name = propType.name;
  }

  const updates = {};
  if (fullname !== undefined) updates.fullname = fullname.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (email !== undefined) updates.email = email.trim().toLowerCase();
  if (housenumber !== undefined) updates.housenumber = housenumber.trim();
  if (apartment !== undefined) updates.apartment = apartment ? apartment.trim() : null;
  if (street_id !== undefined) {
    updates.street_id = street_id;
    if (streetname) updates.streetname = streetname;
  }
  if (property_type_id !== undefined) {
    updates.property_type_id = property_type_id;
    if (property_type_name) updates.property_type_name = property_type_name;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", residentId)
    .eq("estate_id", estateId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateResidentStatus(estateId, residentId, status) {
  if (!estateId || !residentId) throw new Error("Missing estate or resident ID.");

  const { data: resident, error: resErr } = await supabase
    .from("profiles")
    .select("id, estate_id, role")
    .eq("id", residentId)
    .eq("estate_id", estateId)
    .eq("role", "resident")
    .single();

  if (resErr || !resident) {
    throw new Error("Resident not found or unauthorized for this estate.");
  }

  const cleanStatus = status === "Inactive" ? "Inactive" : "Active";

  const { data, error } = await supabase
    .from("profiles")
    .update({ status: cleanStatus })
    .eq("id", residentId)
    .eq("estate_id", estateId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

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

  const { data: resident, error: resError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", residentId)
    .single();

  if (resError || !resident) {
    throw new Error("Resident not found.");
  }

  const receiptid = `MAN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

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

export async function getNigerianBanks() {
  const res = await fetch("/api/banks");
  const json = await res.json();
  if (!json.status) {
    throw new Error(json.error || json.message || "Failed to load banks list.");
  }
  return json.data || [];
}

export async function resolveBankAccount(accountNumber, bankCode) {
  const res = await fetch("/api/resolve-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_number: accountNumber,
      bank_code: bankCode,
    }),
  });

  const json = await res.json();
  if (!json.status) {
    throw new Error(json.message || "Could not verify this bank account.");
  }

  return json.data;
}

export async function connectPayoutAccount(payload) {
  const res = await fetch("/api/subaccount", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!json.status) {
    throw new Error(json.message || "Failed to connect payout account.");
  }

  return json;
}

export async function getEstatePayoutAccount(estateId) {
  if (!estateId) return null;

  const { data, error } = await supabase
    .from("estates")
    .select(`
      id,
      name,
      code,
      paystack_subaccount_code,
      payout_account_status,
      payout_bank_code,
      payout_bank_name,
      payout_account_number,
      payout_account_name,
      payout_account_updated_at
    `)
    .eq("id", estateId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getEstateReconciliation(estateId, { month, year }) {
  if (!estateId) return { estate: null, streets: [], propertyTypes: [], records: [] };

  const [estateRes, streetsRes, propertyTypesRes, residentsRes, paymentsRes, billsRes] =
    await Promise.all([
      supabase.from("estates").select("id, name, code").eq("id", estateId).maybeSingle(),
      supabase
        .from("streets")
        .select("id, name")
        .eq("estate_id", estateId)
        .order("name", { ascending: true }),
      supabase
        .from("property_types")
        .select("id, name, fee")
        .eq("estate_id", estateId)
        .order("fee", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, fullname, email, phone, housenumber, streetname, street_id, property_type_id, property_type_name, status")
        .eq("estate_id", estateId)
        .eq("role", "resident"),
      supabase
        .from("payments")
        .select("id, resident_id, amount, status, paymentMethod, reference, receiptid, createdat")
        .eq("estate_id", estateId)
        .ilike("month", month)
        .eq("year", String(year))
        .eq("status", "Successful"),
      supabase
        .from("bills")
        .select("id, resident_id, amount, status, paid_at")
        .eq("estate_id", estateId)
        .ilike("month", month)
        .eq("year", String(year)),
    ]);

  const estate = estateRes.data || null;
  const streets = streetsRes.data || [];
  const propertyTypes = propertyTypesRes.data || [];
  const residents = residentsRes.data || [];
  const payments = paymentsRes.data || [];
  const bills = billsRes.data || [];

  const paymentMap = {};
  payments.forEach((p) => {
    if (p.resident_id) {
      paymentMap[p.resident_id] = p;
    }
  });

  const billMap = {};
  bills.forEach((b) => {
    if (b.resident_id) {
      billMap[b.resident_id] = b;
    }
  });

  const streetMap = {};
  streets.forEach((s) => {
    streetMap[s.id] = s.name;
  });

  const propertyTypeMap = {};
  propertyTypes.forEach((pt) => {
    propertyTypeMap[pt.id] = pt;
  });

  const activeOrRelevantResidents = residents.filter((r) => {
    const hasActivity = Boolean(paymentMap[r.id]) || Boolean(billMap[r.id]);
    return r.status !== "Inactive" || hasActivity;
  });

  const records = activeOrRelevantResidents.map((r) => {
    const matchedStreet = r.street_id ? streetMap[r.street_id] : null;
    const streetName = r.streetname || matchedStreet || "Unassigned Street";

    let expectedFee = 5000;
    let categoryName = r.property_type_name || "Standard";

    if (r.property_type_id && propertyTypeMap[r.property_type_id]) {
      expectedFee = Number(propertyTypeMap[r.property_type_id].fee) || 5000;
      categoryName = propertyTypeMap[r.property_type_id].name;
    } else if (r.property_type_name) {
      const found = propertyTypes.find(
        (pt) => pt.name.toLowerCase() === r.property_type_name.toLowerCase()
      );
      if (found) {
        expectedFee = Number(found.fee) || 5000;
        categoryName = found.name;
      }
    }

    const p = paymentMap[r.id];
    const b = billMap[r.id];
    const isPaid = Boolean(p) || b?.status === "Paid";
    const paidAmount = p ? Number(p.amount) : b?.status === "Paid" ? Number(b.amount) : 0;
    const method = p?.paymentMethod || (b?.status === "Paid" ? "Manual Bill" : "-");
    const ref = p?.reference || p?.receiptid || "-";
    const paidDate = p?.createdat || b?.paid_at || null;

    return {
      id: r.id,
      resident_id: r.id,
      fullname: r.fullname || "Resident",
      email: r.email || "",
      phone: r.phone || "",
      street_id: r.street_id || "",
      street_name: streetName,
      house_number: r.housenumber || "",
      property_type_id: r.property_type_id || "",
      property_type_name: categoryName,
      expected_fee: expectedFee,
      status: isPaid ? "Paid" : "Unpaid",
      paid_amount: paidAmount,
      payment_method: method,
      reference: ref,
      paid_at: paidDate,
    };
  });

  function parseHouseNumber(val) {
    const match = String(val || "").trim().match(/^\d+/);
    return match ? parseInt(match[0], 10) : 999999;
  }

  records.sort((a, b) => {
    const streetCompare = a.street_name.localeCompare(b.street_name);
    if (streetCompare !== 0) return streetCompare;

    const numA = parseHouseNumber(a.house_number);
    const numB = parseHouseNumber(b.house_number);
    if (numA !== numB) return numA - numB;

    return String(a.house_number || "").localeCompare(
      String(b.house_number || ""),
      undefined,
      { numeric: true, sensitivity: "base" }
    );
  });

  return {
    estate,
    streets,
    propertyTypes,
    records,
  };
}
