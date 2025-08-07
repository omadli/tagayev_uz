import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import Portal from "../ui/Portal";
import Input from "../ui/Input";
import { Button, FormControlLabel, Switch } from "@mui/material";

// Validation schema
const schema = yup.object().shape({
  name: yup.string().required("To'lov turi nomi majburiy"),
  is_active: yup.boolean(),
});

const PaymentTypeModal = ({
  isOpen,
  onClose,
  refreshPaymentTypes,
  paymentType,
}) => {
  const isEditMode = !!paymentType;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        reset({ name: paymentType.name, is_active: paymentType.is_active });
      } else {
        reset({ name: "", is_active: true }); // Default to active for new types
      }
    }
  }, [isOpen, paymentType, isEditMode, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    const toastId = toast.loading(
      isEditMode ? "O'zgarishlar saqlanmoqda..." : "Yangi tur qo'shilmoqda..."
    );
    try {
      if (isEditMode) {
        await api.patch(`/finance/payment-types/${paymentType.id}/`, data);
      } else {
        await api.post("/finance/payment-types/", data);
      }
      toast.success("Muvaffaqiyatli saqlandi", { id: toastId });
      refreshPaymentTypes();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Xatolik yuz berdi", {
        id: toastId,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold">
              {isEditMode
                ? "To'lov Turini Tahrirlash"
                : "Yangi To'lov Turi Qo'shish"}
            </h2>
            <button onClick={handleClose}>
              <X />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto">
            <Input
              id="name"
              label="To'lov turi nomi"
              {...register("name")}
              error={errors.name}
            />
            <FormControlLabel
              control={
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Switch {...field} checked={field.value} />
                  )}
                />
              }
              label="Aktiv"
            />
            <div className="flex justify-end pt-4 gap-3 border-t dark:border-gray-700">
              <Button variant="outlined" onClick={handleClose} className="px-5 py-2.5 border rounded-lg">
                Bekor qilish
              </Button>
              <Button variant="contained" type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg">
                {isEditMode ? "SAQLASH" : "QO'SHISH"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default PaymentTypeModal;
