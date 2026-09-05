import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import { updateResidentStatus } from "../../api/adminApi";
import showToast from "../../utils/showToast";

function DeactivateResidentModal({
  isOpen,
  onClose,
  resident,
  estateId,
  onStatusChanged,
}) {
  const queryClient = useQueryClient();

  const isCurrentlyActive = resident?.status !== "Inactive";
  const targetStatus = isCurrentlyActive ? "Inactive" : "Active";

  const statusMutation = useMutation({
    mutationFn: () =>
      updateResidentStatus(estateId, resident.id, targetStatus),
    onSuccess: (updated) => {
      showToast(
        "success",
        isCurrentlyActive
          ? "Resident deactivated successfully."
          : "Resident reactivated successfully."
      );
      queryClient.invalidateQueries({ queryKey: ["adminResidents"] });
      queryClient.invalidateQueries({ queryKey: ["residentDetails", resident.id] });
      queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
      queryClient.invalidateQueries({ queryKey: ["estateReconciliation"] });
      if (onStatusChanged) onStatusChanged(updated);
      onClose();
    },
    onError: (err) => {
      showToast("error", err.message || "Failed to update resident status.");
    },
  });

  if (!isOpen || !resident) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCurrentlyActive ? "Deactivate resident?" : "Reactivate resident?"}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-sm border border-brand-accent/10 bg-brand-accent/3 p-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${
              isCurrentlyActive
                ? "bg-status-error/10 text-status-error"
                : "bg-status-success/10 text-status-success"
            }`}>
            {isCurrentlyActive ? (
              <AlertTriangle size={20} />
            ) : (
              <CheckCircle2 size={20} />
            )}
          </div>
          <div className="space-y-1 text-sm text-brand-accent">
            <p className="font-semibold text-brand-accent">
              {resident.fullname}
            </p>
            <p className="text-xs text-brand-accent/60">
              {resident.housenumber ? `House ${resident.housenumber}, ` : ""}
              {resident.streetname} ({resident.property_type_name || "House"})
            </p>
          </div>
        </div>

        <p className="text-sm text-brand-accent/80 leading-relaxed">
          {isCurrentlyActive
            ? "This resident will no longer be treated as active for future estate billing. Their previous bills and payment history will remain available."
            : "This resident will be restored as active and included in future estate billing."}
        </p>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer">
            Cancel
          </Button>

          <button
            type="button"
            onClick={() => statusMutation.mutate()}
            disabled={statusMutation.isPending}
            className={`inline-flex h-11 items-center justify-center rounded-sm px-5 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 ${
              isCurrentlyActive
                ? "bg-status-error hover:bg-status-error/90"
                : "bg-brand-primary hover:bg-brand-primary/90"
            }`}>
            {statusMutation.isPending
              ? "Updating..."
              : isCurrentlyActive
              ? "Deactivate resident"
              : "Reactivate resident"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DeactivateResidentModal;
