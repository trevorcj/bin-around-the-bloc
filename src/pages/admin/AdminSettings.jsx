import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  MapPin,
  Tag,
  Plus,
  Edit2,
  Archive,
  Copy,
  Check,
  AlertCircle,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";
import useAuth from "../../hooks/useAuth";
import {
  getEstateSettings,
  updateEstateSettings,
  getEstateStreets,
  createStreet,
  updateStreet,
  getEstatePropertyTypes,
  createPropertyType,
  updatePropertyType,
} from "../../api/adminApi";
import { StyledH1 } from "../../styles/CommonStyles";
import Button from "../../ui/Button";
import InputUi from "../../ui/Input";
import Modal from "../../ui/Modal";
import PayoutAccountModal from "./PayoutAccountModal";
import formatCurrency from "../../utils/formatCurrency";
import showToast from "../../utils/showToast";

function AdminSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const estateId = user?.estate_id;

  const [copied, setCopied] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  const [isAddStreetOpen, setIsAddStreetOpen] = useState(false);
  const [newStreetName, setNewStreetName] = useState("");
  const [editingStreet, setEditingStreet] = useState(null);

  const [isAddPropertyTypeOpen, setIsAddPropertyTypeOpen] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newPropertyFee, setNewPropertyFee] = useState("");
  const [editingPropertyType, setEditingPropertyType] = useState(null);

  const [isEditingEstate, setIsEditingEstate] = useState(false);
  const [estateName, setEstateName] = useState("");
  const [estateLocation, setEstateLocation] = useState("");
  const [estateDescription, setEstateDescription] = useState("");
  const [estatePhone, setEstatePhone] = useState("");

  const { data: estate } = useQuery({
    queryKey: ["estateSettings", estateId],
    queryFn: async () => {
      const data = await getEstateSettings(estateId);
      if (data) {
        setEstateName(data.name || "");
        setEstateLocation(data.location || "");
        setEstateDescription(data.description || "");
        setEstatePhone(data.contact_phone || "");
      }
      return data;
    },
    enabled: !!estateId,
  });

  const { data: streets = [] } = useQuery({
    queryKey: ["estateStreets", estateId],
    queryFn: () => getEstateStreets(estateId, true),
    enabled: !!estateId,
  });

  const { data: propertyTypes = [] } = useQuery({
    queryKey: ["estatePropertyTypes", estateId],
    queryFn: () => getEstatePropertyTypes(estateId, true),
    enabled: !!estateId,
  });

  const updateEstateMutation = useMutation({
    mutationFn: (payload) => updateEstateSettings(estateId, payload),
    onSuccess: () => {
      showToast("success", "Estate details updated.");
      setIsEditingEstate(false);
      queryClient.invalidateQueries({ queryKey: ["estateSettings", estateId] });
    },
    onError: (err) => showToast("error", err.message),
  });

  const addStreetMutation = useMutation({
    mutationFn: (name) => createStreet(estateId, name),
    onSuccess: () => {
      showToast("success", "Street added successfully.");
      setNewStreetName("");
      setIsAddStreetOpen(false);
      queryClient.invalidateQueries({ queryKey: ["estateStreets"] });
      queryClient.invalidateQueries({ queryKey: ["adminResidents"] });
    },
    onError: (err) => showToast("error", err.message),
  });

  const updateStreetMutation = useMutation({
    mutationFn: ({ id, updates }) => updateStreet(id, updates),
    onSuccess: () => {
      showToast("success", "Street updated.");
      setEditingStreet(null);
      queryClient.invalidateQueries({ queryKey: ["estateStreets"] });
      queryClient.invalidateQueries({ queryKey: ["adminResidents"] });
    },
    onError: (err) => showToast("error", err.message),
  });

  const addPropertyTypeMutation = useMutation({
    mutationFn: ({ name, fee }) => createPropertyType(estateId, name, fee),
    onSuccess: () => {
      showToast("success", "Property category added.");
      setNewPropertyName("");
      setNewPropertyFee("");
      setIsAddPropertyTypeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["estatePropertyTypes"] });
      queryClient.invalidateQueries({ queryKey: ["adminResidents"] });
    },
    onError: (err) => showToast("error", err.message),
  });

  const updatePropertyTypeMutation = useMutation({
    mutationFn: ({ id, updates }) => updatePropertyType(id, updates),
    onSuccess: () => {
      showToast("success", "Property category updated.");
      setEditingPropertyType(null);
      queryClient.invalidateQueries({ queryKey: ["estatePropertyTypes"] });
      queryClient.invalidateQueries({ queryKey: ["adminResidents"] });
    },
    onError: (err) => showToast("error", err.message),
  });

  async function handleCopyCode() {
    if (!estate?.code) return;
    try {
      await navigator.clipboard.writeText(estate.code);
      setCopied(true);
      showToast("success", "Estate code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("error", "Failed to copy code.");
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <StyledH1>Estate Settings</StyledH1>
        <p className="text-brand-accent/80 mt-1">
          Configure estate parameters, onboarding code, streets, and snapshot-safe property fee categories.
        </p>
      </div>

      <section className="border border-brand-accent/10 rounded-sm bg-white p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-brand-accent/10 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brand-accent">
                Estate Profile & Onboarding Code
              </h2>
              <p className="text-xs text-brand-accent/50">
                General estate identification and resident join credentials.
              </p>
            </div>
          </div>

          {!isEditingEstate ? (
            <button
              type="button"
              onClick={() => setIsEditingEstate(true)}
              className="text-xs font-semibold text-brand-primary hover:underline self-start sm:self-auto cursor-pointer">
              Edit Details
            </button>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-brand-accent/3 border border-brand-accent/10 rounded-sm gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-accent/50 block">
              Unique Estate Code (Share with Residents)
            </span>
            <span className="font-mono text-xl font-bold text-brand-primary tracking-widest mt-1 block">
              {estate?.code || "..."}
            </span>
            <p className="text-xs text-brand-accent/50 mt-1">
              Residents enter this code during signup to join {estate?.name}.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-brand-accent text-white text-xs font-semibold hover:bg-brand-accent/90 transition-colors cursor-pointer self-start sm:self-auto">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy Code"}
          </button>
        </div>

        {!isEditingEstate ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/40">
                Estate Name
              </p>
              <p className="font-medium text-brand-accent mt-1">
                {estate?.name || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/40">
                Location
              </p>
              <p className="font-medium text-brand-accent mt-1">
                {estate?.location || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/40">
                Contact Phone
              </p>
              <p className="font-medium text-brand-accent mt-1">
                {estate?.contact_phone || "N/A"}
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateEstateMutation.mutate({
                name: estateName.trim(),
                location: estateLocation.trim(),
                description: estateDescription.trim(),
                contact_phone: estatePhone.trim(),
              });
            }}
            className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputUi
                label="Estate Name"
                type="text"
                required
                value={estateName}
                onChange={(e) => setEstateName(e.target.value)}
              />
              <InputUi
                label="Location / Area"
                type="text"
                value={estateLocation}
                onChange={(e) => setEstateLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputUi
                label="Contact Phone"
                type="tel"
                value={estatePhone}
                onChange={(e) => setEstatePhone(e.target.value)}
              />
              <InputUi
                label="Description"
                type="text"
                value={estateDescription}
                onChange={(e) => setEstateDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                size="small"
                disabled={updateEstateMutation.isPending}>
                {updateEstateMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
              <button
                type="button"
                onClick={() => setIsEditingEstate(false)}
                className="px-4 py-2 text-xs rounded-sm border border-brand-accent/10 text-brand-accent hover:bg-brand-accent/5 cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="border border-brand-accent/10 rounded-sm bg-white p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-brand-accent/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brand-accent">
                Streets Configuration
              </h2>
              <p className="text-xs text-brand-accent/50">
                Streets residents can select during registration.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddStreetOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/95 transition-colors cursor-pointer self-start sm:self-auto">
            <Plus size={15} /> Add Street
          </button>
        </div>

        {streets.length === 0 ? (
          <p className="text-xs text-brand-accent/50 py-2">
            No streets added yet. Add your estate's streets so new residents can easily select them during registration.
          </p>
        ) : (
          <div className="divide-y divide-brand-accent/8">
            {streets.map((st) => (
              <div
                key={st.id}
                className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "font-medium",
                      st.is_archived
                        ? "text-brand-accent/40 line-through"
                        : "text-brand-accent"
                    )}>
                    {st.name}
                  </span>
                  {st.is_archived && (
                    <span className="px-2 py-0.5 rounded-sm bg-brand-accent/5 text-[10px] font-semibold text-brand-accent/50">
                      Archived
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingStreet(st)}
                    className="p-1 text-brand-accent/50 hover:text-brand-accent cursor-pointer"
                    title="Rename street">
                    <Edit2 size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateStreetMutation.mutate({
                        id: st.id,
                        updates: { is_archived: !st.is_archived },
                      })
                    }
                    className="p-1 text-brand-accent/50 hover:text-status-error cursor-pointer"
                    title={st.is_archived ? "Unarchive street" : "Archive street"}>
                    <Archive size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border border-brand-accent/10 rounded-sm bg-white p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-brand-accent/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-secondary/10 text-brand-secondary">
              <Tag size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brand-accent">
                Property Categories & Waste Collection Fees
              </h2>
              <p className="text-xs text-brand-accent/50">
                Configurable property categories with snapshot-safe monthly charges.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddPropertyTypeOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/95 transition-colors cursor-pointer self-start sm:self-auto">
            <Plus size={15} /> Add Property Category
          </button>
        </div>

        <div className="p-3 bg-brand-accent/2 border border-brand-accent/10 rounded-sm text-xs text-brand-accent/65 flex items-start gap-2">
          <AlertCircle size={16} className="text-brand-primary shrink-0 mt-0.5" />
          <span>
            <strong>Historical Snapshot Protection:</strong> When you update a category's fee, existing bills and transaction records remain unchanged. Only newly generated bills will use the updated rate.
          </span>
        </div>

        {propertyTypes.length === 0 ? (
          <p className="text-xs text-brand-accent/50 py-2">
            No property categories configured yet. Add categories (e.g. House, Flat, Shop) before residents register.
          </p>
        ) : (
          <div className="divide-y divide-brand-accent/8">
            {propertyTypes.map((pt) => (
              <div
                key={pt.id}
                className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      "font-semibold text-base",
                      pt.is_archived
                        ? "text-brand-accent/40 line-through"
                        : "text-brand-accent"
                    )}>
                    {pt.name}
                  </span>
                  <span className="font-semibold text-brand-primary">
                    {formatCurrency(pt.fee, "NGN")} / mo
                  </span>
                  {pt.is_archived && (
                    <span className="px-2 py-0.5 rounded-sm bg-brand-accent/5 text-[10px] font-semibold text-brand-accent/50">
                      Archived
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingPropertyType(pt)}
                    className="p-1 text-brand-accent/50 hover:text-brand-accent cursor-pointer"
                    title="Edit category or fee">
                    <Edit2 size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updatePropertyTypeMutation.mutate({
                        id: pt.id,
                        updates: { is_archived: !pt.is_archived },
                      })
                    }
                    className="p-1 text-brand-accent/50 hover:text-status-error cursor-pointer"
                    title={pt.is_archived ? "Unarchive" : "Archive"}>
                    <Archive size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border border-brand-accent/10 rounded-sm bg-white p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-accent/10 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary">
              <Landmark size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-brand-accent">Payout Account</h2>
                {estate?.payout_account_status === "connected" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    <ShieldCheck size={12} /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                    Not connected
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-brand-accent/65">
                This is the bank account where payments collected from residents will be settled.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsPayoutModalOpen(true)}
            variant="outline"
            size="small">
            {estate?.payout_account_status === "connected" ? "Change Account" : "Connect Account"}
          </Button>
        </div>

        {estate?.payout_account_status === "connected" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/40">
                  Account Name
                </p>
                <p className="font-semibold text-brand-accent mt-1">
                  {estate.payout_account_name || estate.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/40">
                  Settlement Bank
                </p>
                <p className="font-semibold text-brand-accent mt-1">
                  {estate.payout_bank_name || "Bank"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/40">
                  Account Number
                </p>
                <p className="font-semibold text-brand-accent mt-1 font-mono">
                  {estate.payout_account_number
                    ? `••••••${estate.payout_account_number.slice(-4)}`
                    : "••••••••••"}
                </p>
              </div>
            </div>

            <div className="rounded-sm border border-brand-accent/10 bg-brand-accent/[0.02] p-3 text-xs text-brand-accent/75">
              Payouts are automatically settled into the estate&apos;s bank account every morning (next business day T+1) by Paystack.
            </div>
          </div>
        ) : (
          <div className="rounded-sm border border-dashed border-brand-accent/20 p-6 text-center">
            <p className="text-sm font-medium text-brand-accent">
              No payout account connected yet
            </p>
            <p className="mt-1 text-xs text-brand-accent/60 max-w-md mx-auto">
              Connect your estate bank account to start receiving automated settlements from resident waste-collection payments directly.
            </p>
            <div className="mt-4">
              <Button size="small" onClick={() => setIsPayoutModalOpen(true)}>
                Connect Payout Account
              </Button>
            </div>
          </div>
        )}
      </section>

      <Modal
        isOpen={isAddStreetOpen}
        onClose={() => setIsAddStreetOpen(false)}
        title="Add New Street">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newStreetName.trim()) return;
            addStreetMutation.mutate(newStreetName.trim());
          }}
          className="space-y-4">
          <InputUi
            label="Street Name"
            type="text"
            required
            placeholder="e.g. Palm Street"
            value={newStreetName}
            onChange={(e) => setNewStreetName(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddStreetOpen(false)}
              className="px-4 py-2 text-xs rounded-sm border border-brand-accent/10">
              Cancel
            </button>
            <Button
              type="submit"
              size="small"
              disabled={addStreetMutation.isPending || !newStreetName.trim()}>
              {addStreetMutation.isPending ? "Adding…" : "Add Street"}
            </Button>
          </div>
        </form>
      </Modal>

      {editingStreet && (
        <Modal
          isOpen={!!editingStreet}
          onClose={() => setEditingStreet(null)}
          title="Edit Street Name">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingStreet.name?.trim()) return;
              updateStreetMutation.mutate({
                id: editingStreet.id,
                updates: { name: editingStreet.name.trim() },
              });
            }}
            className="space-y-4">
            <InputUi
              label="Street Name"
              type="text"
              required
              value={editingStreet.name}
              onChange={(e) =>
                setEditingStreet({ ...editingStreet, name: e.target.value })
              }
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingStreet(null)}
                className="px-4 py-2 text-xs rounded-sm border border-brand-accent/10">
                Cancel
              </button>
              <Button
                type="submit"
                size="small"
                disabled={updateStreetMutation.isPending}>
                Save
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <Modal
        isOpen={isAddPropertyTypeOpen}
        onClose={() => setIsAddPropertyTypeOpen(false)}
        title="Add Property Category">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newPropertyName.trim() || !newPropertyFee) return;
            addPropertyTypeMutation.mutate({
              name: newPropertyName.trim(),
              fee: Number(newPropertyFee),
            });
          }}
          className="space-y-4">
          <InputUi
            label="Category Name (e.g. Annex, Office, Penthouse)"
            type="text"
            required
            value={newPropertyName}
            onChange={(e) => setNewPropertyName(e.target.value)}
          />

          <InputUi
            label="Monthly Waste Collection Fee (₦)"
            type="number"
            required
            placeholder="5000"
            value={newPropertyFee}
            onChange={(e) => setNewPropertyFee(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddPropertyTypeOpen(false)}
              className="px-4 py-2 text-xs rounded-sm border border-brand-accent/10">
              Cancel
            </button>
            <Button
              type="submit"
              size="small"
              disabled={
                addPropertyTypeMutation.isPending ||
                !newPropertyName.trim() ||
                !newPropertyFee
              }>
              {addPropertyTypeMutation.isPending ? "Adding…" : "Add Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {editingPropertyType && (
        <Modal
          isOpen={!!editingPropertyType}
          onClose={() => setEditingPropertyType(null)}
          title={`Edit ${editingPropertyType.name}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePropertyTypeMutation.mutate({
                id: editingPropertyType.id,
                updates: {
                  name: editingPropertyType.name.trim(),
                  fee: Number(editingPropertyType.fee),
                },
              });
            }}
            className="space-y-4">
            <InputUi
              label="Category Name"
              type="text"
              required
              value={editingPropertyType.name}
              onChange={(e) =>
                setEditingPropertyType({
                  ...editingPropertyType,
                  name: e.target.value,
                })
              }
            />

            <InputUi
              label="Monthly Fee (₦)"
              type="number"
              required
              value={editingPropertyType.fee}
              onChange={(e) =>
                setEditingPropertyType({
                  ...editingPropertyType,
                  fee: e.target.value,
                })
              }
            />

            <p className="text-xs text-brand-accent/50">
              Changing this fee will apply to new monthly bills. Past bills and payment receipts are preserved.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPropertyType(null)}
                className="px-4 py-2 text-xs rounded-sm border border-brand-accent/10">
                Cancel
              </button>
              <Button
                type="submit"
                size="small"
                disabled={updatePropertyTypeMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <PayoutAccountModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        estateId={estateId}
        currentPayoutAccount={estate}
        isEditing={estate?.payout_account_status === "connected"}
      />
    </div>
  );
}

export default AdminSettings;
