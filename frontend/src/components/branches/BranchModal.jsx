import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import Portal from "../ui/Portal";
import Input from "../ui/Input";
import { Button } from "@mui/material";

// Validation schema
const schema = yup.object().shape({
  name: yup.string().required("Filial nomi majburiy"),
  address: yup.string().required("Manzil majburiy"),
  extra_info: yup.string(),
});

const BranchModal = ({ isOpen, onClose, refreshBranches, branch }) => {
  const isEditMode = !!branch;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        reset({
          name: branch.name,
          address: branch.address,
          extra_info: branch.extra_info,
        });
      } else {
        reset({ name: "", address: "", extra_info: "" });
      }
    }
  }, [isOpen, branch, isEditMode, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    const toastId = toast.loading(
      isEditMode ? "O'zgarishlar saqlanmoqda..." : "Filial qo'shilmoqda..."
    );
    try {
      if (isEditMode) {
        await api.patch(`/core/branches/${branch.id}/`, data);
      } else {
        await api.post("/core/branches/", data);
      }
      toast.success(
        isEditMode ? "Muvaffaqiyatli saqlandi" : "Muvaffaqiyatli qo'shildi",
        { id: toastId }
      );
      refreshBranches();
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
              {isEditMode ? "Filialni Tahrirlash" : "Yangi Filial Qo'shish"}
            </h2>
            <button onClick={handleClose}>
              <X />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto">
            <Input
              id="name"
              label="Filial nomi"
              {...register("name")}
              error={errors.name}
            />
            <Input
              id="address"
              label="Manzil"
              {...register("address")}
              error={errors.address}
            />
            <Input
              id="extra_info"
              label="Qo'shimcha ma'lumot (ixtiyoriy)"
              {...register("extra_info")}
              error={errors.extra_info}
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

export default BranchModal;
