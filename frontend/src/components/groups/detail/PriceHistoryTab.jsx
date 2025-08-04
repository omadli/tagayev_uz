import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { IconButton, CircularProgress, Button } from "@mui/material";
import { Edit, Trash2, Plus, Check, X } from "lucide-react";
import dayjs from "dayjs";

// Import our custom, styled input components
import NumberInput from "../../ui/NumberInput";
import DateInput from "../../ui/DateInput";

// Validation schema for the inline form
const schema = yup.object().shape({
  price: yup
    .number()
    .min(0, "Narx manfiy bo'lishi mumkin emas")
    .required("Narx majburiy")
    .typeError("Narx majburiy"),
  start_date: yup.date().required("Sana majburiy").typeError("Sana noto'g'ri"),
});

const formatNumber = (num) => {
  if (num === null || num === undefined) return "";
  // Check if the number has no fractional part
  if (parseFloat(num) % 1 === 0) {
    return parseInt(num, 10);
  }
  return num;
};

const PriceHistoryTab = ({
  priceHistory: initialHistory,
  groupId,
  refreshGroupDetails,
}) => {
  const { user: currentUser } = useAuth();
  const isManager =
    currentUser.roles.includes("Admin") || currentUser.roles.includes("CEO");

  // State
  const [priceHistory, setPriceHistory] = useState(initialHistory);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // For general loading state

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // --- FORM SUBMISSION LOGIC ---
  const onSubmit = async (data, priceRecordId = null) => {
    const payload = {
      group: groupId,
      price: formatNumber(data.price),
      start_date: dayjs(data.start_date).format("YYYY-MM-DD"),
    };

    const toastId = toast.loading(
      priceRecordId ? "Saqlanmoqda..." : "Qo'shilmoqda..."
    );
    try {
      if (priceRecordId) {
        console.log(priceRecordId);
        await api.patch(`/finance/group-prices/${priceRecordId}/`, payload);
      } else {
        await api.post("/finance/group-prices/", payload);
      }
      toast.success("Muvaffaqiyatli saqlandi", { id: toastId });
      // After a successful save, re-fetch all group details to get the updated history
      // and the new 'current_price' in the info panel.
      await refreshGroupDetails();
      setIsAdding(false);
      setEditingId(null);
      reset({ price: "", start_date: new Date() });
    } catch (error) {
      const errorMsg =
        error.response?.data?.start_date?.[0] ||
        error.response?.data?.detail ||
        "Xatolik yuz berdi";
      toast.error(errorMsg, { id: toastId });
    }
  };

  // --- DELETE LOGIC ---
  const handleDelete = async (priceId) => {
    if (window.confirm("Bu narxni o'chirishga ishonchingiz komilmi?")) {
      const toastId = toast.loading("O'chirilmoqda...");
      try {
        await api.delete(`/finance/group-prices/${priceId}/`);
        toast.success("Muvaffaqiyatli o'chirildi", { id: toastId });
        await refreshGroupDetails();
      } catch (error) {
        toast.error(error.response?.data?.detail || "Xatolik yuz berdi", {
          id: toastId,
        });
      }
    }
  };

  // This effect updates the local state if the parent data changes
  useEffect(() => {
    setPriceHistory(initialHistory);
  }, [initialHistory]);

  // --- Inline Edit Row Sub-Component ---
  const EditRow = ({ priceRecord, onCancel }) => {
    // Each edit row gets its own form instance
    const { control: editControl, handleSubmit: handleEditSubmit } = useForm({
      resolver: yupResolver(schema),
      defaultValues: {
        price: priceRecord.price,
        start_date: dayjs(priceRecord.start_date),
      },
    });
    return (
      <form
        onSubmit={handleEditSubmit((data) => onSubmit(data, priceRecord.id))}
        className="flex items-start gap-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md"
      >
        <NumberInput
          name="price"
          label="Narx"
          control={editControl}
          suffix=" so'm"
        />
        <DateInput name="start_date" label="Sana" control={editControl} />
        <div className="flex pt-2">
          <IconButton type="submit" color="primary" size="small">
            <Check />
          </IconButton>
          <IconButton onClick={onCancel} size="small">
            <X />
          </IconButton>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <CircularProgress />
      ) : (
        <ul className="space-y-2">
          {priceHistory.map((p) => (
            <li key={p.id}>
              {editingId === p.id ? (
                <EditRow priceRecord={p} onCancel={() => setEditingId(null)} />
              ) : (
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                  <div className="font-semibold">
                    {new Intl.NumberFormat("fr-FR").format(p.price)} so'm
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {dayjs(p.start_date).format("DD/MM/YYYY")} dan boshlab
                    </span>
                    {isManager && (
                      <div className="flex">
                        <IconButton
                          size="small"
                          onClick={() => setEditingId(p.id)}
                        >
                          <Edit size={16} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {isManager && (
        <div className="pt-4">
          {!isAdding ? (
            <Button
              variant="outlined"
              startIcon={<Plus />}
              onClick={() => setIsAdding(true)}
            >
              Yangi narx qo'shish
            </Button>
          ) : (
            <form
              onSubmit={handleSubmit((data) => onSubmit(data))}
              className="p-4 border dark:border-dark-accent rounded-lg space-y-4 bg-gray-50 dark:bg-dark-tertiary"
            >
              <h4 className="font-medium">Yangi narx kiritish</h4>
              <div className="flex flex-col md:flex-row items-start gap-4">
                <NumberInput
                  name="price"
                  suffix=" so'm"
                  label="Narx"
                  control={control}
                  error={errors.price}
                />
                <DateInput
                  name="start_date"
                  label="O'zgarish sanasi"
                  control={control}
                  error={errors.start_date}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="text" onClick={() => setIsAdding(false)}>
                  Bekor qilish
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={isSubmitting}
                >
                  Saqlash
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceHistoryTab;
