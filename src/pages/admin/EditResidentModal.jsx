import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, AlertCircle } from "lucide-react";
import Modal from "../../ui/Modal";
import InputUi from "../../ui/Input";
import DropdownUi from "../../ui/DropdownUi";
import Button from "../../ui/Button";
import {
  getEstateStreets,
  getEstatePropertyTypes,
  updateResidentDetails,
} from "../../api/adminApi";
import showToast from "../../utils/showToast";
import formatCurrency from "../../utils/formatCurrency";

function EditResidentForm({
  resident,
  estateId,
  streets,
  propertyTypes,
  onClose,
  onUpdated,
}) {
  const queryClient = useQueryClient();

  const defaultStreetId =
    resident?.street_id ||
    streets.find(
      (s) => s.name.toLowerCase() === (resident?.streetname || "").toLowerCase()
    )?.id ||
    streets[0]?.id ||
    "";

  const defaultPropertyTypeId =
    resident?.property_type_id ||
    propertyTypes.find(
      (pt) =>
        pt.name.toLowerCase() === (resident?.property_type_name || "").toLowerCase()
    )?.id ||
    propertyTypes[0]?.id ||
    "";

  const [fullname, setFullname] = useState(resident?.fullname || "");
  const [phone, setPhone] = useState(resident?.phone || "");
  const [email, setEmail] = useState(resident?.email || "");
  const [streetId, setStreetId] = useState(defaultStreetId);
  const [housenumber, setHousenumber] = useState(resident?.housenumber || "");
  const [apartment, setApartment] = useState(resident?.apartment || "");
  const [propertyTypeId, setPropertyTypeId] = useState(defaultPropertyTypeId);
  const [errorMsg, setErrorMsg] = useState("");

  const updateMutation = useMutation({
    mutationFn: (updates) =>
      updateResidentDetails(estateId, resident.id, updates),
    onSuccess: (updated) => {
      showToast("success", "Resident profile updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["adminResidents"] });
      queryClient.invalidateQueries({ queryKey: ["residentDetails", resident.id] });
      queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
      queryClient.invalidateQueries({ queryKey: ["estateReconciliation"] });
      if (onUpdated) onUpdated(updated);
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to update resident details.");
      showToast("error", err.message || "Failed to update resident details.");
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!fullname.trim()) {
      setErrorMsg("Resident full name is required.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("A valid email address is required.");
      return;
    }

    if (!streetId) {
      setErrorMsg("Please select a street.");
      return;
    }

    if (!housenumber.trim()) {
      setErrorMsg("Property number / house number is required.");
      return;
    }

    if (!propertyTypeId) {
      setErrorMsg("Please select a property category.");
      return;
    }

    updateMutation.mutate({
      fullname,
      phone,
      email,
      street_id: streetId,
      housenumber,
      apartment,
      property_type_id: propertyTypeId,
    });
  }

  const streetOptions = streets.map((s) => ({
    label: s.name,
    value: s.id,
  }));

  const propertyTypeOptions = propertyTypes.map((pt) => ({
    label: `${pt.name} (${formatCurrency(pt.fee, "NGN")}/mo)`,
    value: pt.id,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="rounded-sm bg-status-error/10 p-3 text-xs font-medium text-status-error">
          {errorMsg}
        </div>
      )}

      <InputUi
        label="Full Name"
        type="text"
        required
        placeholder="e.g. John Doe"
        value={fullname}
        onChange={(e) => setFullname(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputUi
          label="Email Address"
          type="email"
          required
          placeholder="resident@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <InputUi
          label="Phone Number"
          type="tel"
          placeholder="080 1234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-brand-accent">
            Street <span className="text-status-error">*</span>
          </label>
          <DropdownUi
            options={streetOptions}
            value={streetId}
            onChange={setStreetId}
            placeholder="Select street"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-brand-accent">
            Property Category <span className="text-status-error">*</span>
          </label>
          <DropdownUi
            options={propertyTypeOptions}
            value={propertyTypeId}
            onChange={setPropertyTypeId}
            placeholder="Select category"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputUi
          label="House / Plot Number"
          type="text"
          required
          placeholder="e.g. 12B"
          value={housenumber}
          onChange={(e) => setHousenumber(e.target.value)}
        />

        <InputUi
          label="Unit / Apartment (Optional)"
          type="text"
          placeholder="e.g. Flat 3, Wing A"
          value={apartment}
          onChange={(e) => setApartment(e.target.value)}
        />
      </div>

      <div className="rounded-sm border border-brand-primary/20 bg-brand-primary/5 p-3 flex items-start gap-2.5">
        <AlertCircle size={16} className="text-brand-primary shrink-0 mt-0.5" />
        <p className="text-xs text-brand-accent/80 leading-relaxed">
          <strong>Future Billing Only:</strong> Updating a resident's property category will only apply to future monthly billing cycles. Historical bills, settled payments, and past receipts remain permanently protected.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="cursor-pointer">
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="cursor-pointer inline-flex items-center gap-2">
          <Save size={16} />
          {updateMutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function EditResidentModal({ isOpen, onClose, resident, estateId, onUpdated }) {
  const { data: streets = [] } = useQuery({
    queryKey: ["estateStreets", estateId, "active"],
    queryFn: () => getEstateStreets(estateId, false),
    enabled: !!estateId && isOpen,
  });

  const { data: propertyTypes = [] } = useQuery({
    queryKey: ["estatePropertyTypes", estateId, "active"],
    queryFn: () => getEstatePropertyTypes(estateId, false),
    enabled: !!estateId && isOpen,
  });

  if (!isOpen || !resident) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Resident Information">
      <EditResidentForm
        key={`${resident.id}-${streets.length}-${propertyTypes.length}`}
        resident={resident}
        estateId={estateId}
        streets={streets}
        propertyTypes={propertyTypes}
        onClose={onClose}
        onUpdated={onUpdated}
      />
    </Modal>
  );
}

export default EditResidentModal;
