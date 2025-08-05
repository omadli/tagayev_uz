import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Portal from "../../ui/Portal";
import { useSettings } from "../../../context/SettingsContext";
import { getMuiTheme } from "../../../theme/muiTheme";
import { ThemeProvider } from "@mui/material/styles";
import { TextField, Button } from "@mui/material";
import { X } from "lucide-react";
import dayjs from "dayjs";

// Simple validation schema to ensure the comment is not empty
const schema = yup.object().shape({
  comment: yup.string().optional(),
});

const CommentModal = ({
  isOpen,
  onClose,
  onSubmit,
  studentName,
  lessonDate,
}) => {
  const { theme } = useSettings();
  const muiTheme = getMuiTheme(theme);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      comment: "",
    },
  });

  // Reset the form whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      reset({ comment: "" });
    }
  }, [isOpen, reset]);

  // This function calls the parent's onSubmit with the form data
  const handleFormSubmit = (data) => {
    onSubmit(data.comment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <ThemeProvider theme={muiTheme}>
          <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b dark:border-dark-tertiary">
              <h2 className="text-xl font-bold text-gray-800 dark:text-text-light-primary">
                Izoh kiritish
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-accent"
              >
                <X />
              </button>
            </div>
            <form
              onSubmit={handleSubmit(handleFormSubmit)}
              className="p-6 space-y-5"
            >
              <div className="text-sm text-gray-600 dark:text-text-light-secondary">
                <p>
                  <strong className="font-semibold text-gray-800 dark:text-text-light-primary">
                    {studentName || "Tanlangan o'quvchi"}
                  </strong>{" "}
                  ning {" "}
                  <strong className="font-semibold text-gray-800 dark:text-text-light-primary">
                    {dayjs(lessonDate).format("DD-MMMM YYYY")}{"-yil "}
                  </strong>
                  sanasidagi darsga kelmaganligi agar sababli bo'lsa izoh yozing:
                </p>
              </div>

              <Controller
                name="comment"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Izoh"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    autoFocus
                  />
                )}
              />

              <div className="flex justify-end pt-4 gap-3">
                <Button variant="outlined" onClick={onClose}>
                  Bekor qilish
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={isSubmitting}
                  color="primary"
                >
                  Saqlash
                </Button>
              </div>
            </form>
          </div>
        </ThemeProvider>
      </div>
    </Portal>
  );
};

export default CommentModal;