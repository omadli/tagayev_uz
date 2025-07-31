import { React, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import Portal from "../ui/Portal";
import NumberInput from "../ui/NumberInput";
import DateInput from "../ui/DateInput";

// --- THIS IS THE DEFINITIVE FIX ---
// We will pass the price history into the schema for validation.
const createSchema = (priceHistory = []) =>
  yup.object().shape({
    price: yup
      .number()
      .min(0, "Narx manfiy bo'lishi mumkin emas")
      .required("Narx kiritilishi shart")
      .typeError("Faqat raqam kiriting"),
    start_date: yup
      .date()
      .required("Sana kiritilishi shart")
      .typeError("Sana to'g'ri formatda bo'lishi kerak")
      // --- Custom Validation Rule ---
      .test(
        "is-unique-date",
        "Bu sana uchun narx allaqachon mavjud.", // The user-friendly error message
        (value) => {
          if (!value) return true; // Don't validate if there's no date

          // Format the selected date to 'YYYY-MM-DD' for comparison
          const selectedDateStr = value.toISOString().split("T")[0];

          // Check if any date in the existing price history matches the selected date
          return !priceHistory.some((p) => p.start_date === selectedDateStr);
        }
      ),
  });

const PriceChangeModal = ({ isOpen, onClose, refreshGroups, group }) => {
  // State to hold the group's price history
  const [priceHistory, setPriceHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // --- Create a dynamic schema that depends on the priceHistory state ---
  const schema = createSchema(priceHistory);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    // Use the dynamic schema with the resolver
    resolver: yupResolver(schema),
    defaultValues: {
      start_date: new Date(),
    },
    // Important: Re-validate when the priceHistory changes
    context: { priceHistory },
  });

  // Fetch the price history when the modal opens
  useEffect(() => {
    if (isOpen && group) {
      setIsLoadingHistory(true);
      api
        .get(`/finance/group-prices/?group=${group.id}`)
        .then((res) => setPriceHistory(res.data))
        .catch(() => toast.error("Narxlar tarixini yuklab bo'lmadi."))
        .finally(() => setIsLoadingHistory(false));

      reset({
        price: group.current_price || 0,
        start_date: new Date(),
      });
    }
  }, [isOpen, group, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    const payload = {
      group: group.id,
      price: data.price,
      start_date: data.start_date.toISOString().split("T")[0],
    };

    const toastId = toast.loading("Yangi narx saqlanmoqda...");
    try {
      await api.post("/finance/group-prices/", payload);
      toast.success("Narx muvaffaqiyatli o'zgartirildi", { id: toastId });
      refreshGroups();
      handleClose();
    } catch (error) {
      // The backend error is now a fallback, as the frontend should catch most issues.
      const errorMsg =
        error.response?.data?.non_field_errors?.[0] || "Xatolik yuz berdi";
      toast.error(errorMsg, { id: toastId });
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold truncate">
              "{group.name}" narxini o'zgartirish
            </h2>
            <button onClick={handleClose}>
              <X />
            </button>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <NumberInput
                name="price"
                label="Yangi narx"
                suffix=" so'm"
                control={control}
                error={errors.price}
              />
              <DateInput
                name="start_date"
                label="O'zgarish sanasi"
                control={control}
                error={errors.start_date}
              />
              <div className="flex justify-end pt-4 gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 border rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg"
                >
                  SAQLASH
                </button>
              </div>
            </form>

            <div className="pt-6 border-t dark:border-gray-700">
              <h3 className="font-semibold mb-3">Narxlar tarixi</h3>
              {isLoadingHistory ? (
                <p>Yuklanmoqda...</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {priceHistory.map((p) => (
                    <li
                      key={p.id}
                      className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                    >
                      <span>
                        <strong>
                          {new Intl.NumberFormat("fr-FR").format(p.price)} so'm
                        </strong>
                      </span>
                      <span className="text-gray-500">
                        {new Date(p.start_date).toLocaleDateString("en-GB")} dan
                        boshlab
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default PriceChangeModal;
