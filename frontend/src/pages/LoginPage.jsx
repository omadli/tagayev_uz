import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

// Import our beautiful, reusable input components
import Input from "../components/ui/Input";
import PhoneNumberInput from "../components/ui/PhoneNumberInput";

// Form validation schema
const schema = yup.object().shape({
  phone_number: yup
    .string()
    .transform((value) => `+998${value.replace(/[^\d]/g, "")}`)
    .matches(/^\+998\d{9}$/, "Raqam to'liq kiritilishi kerak")
    .required("Telefon raqam majburiy"),
  password: yup.string().required("Parol kiritish majburiy"),
});

const LoginPage = () => {
  const { loginUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // React Hook Form initialization
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onLoginSubmit = async (data) => {
    const loadingToast = toast.loading("Kirilmoqda...");
    try {
      // The phone number from the form is already in the correct format with +998
      await loginUser(data.phone_number, data.password);
      toast.dismiss(loadingToast);
      // Navigation on success is handled by AuthContext
    } catch (err) {
      toast.dismiss(loadingToast);
      if (err.response && err.response.status === 401) {
        toast.error("Kirish muvaffaqiyatsiz. Raqam yoki parolni tekshiring.");
      } else {
        toast.error("Serverga ulanishda xatolik yuz berdi.");
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
      {/* Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{ backgroundImage: "url('/request-form-bg.webp')" }}
      ></div>

      {/* Login Form Card */}
      <div className="relative z-10 w-full max-w-sm p-8 space-y-8 bg-white rounded-2xl shadow-lg hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-300 ">
            Tagayev.uz ga Xush kelibsiz 👋
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-200">
            Iltimos tizimga kirish uchun shaxsiy malumotlaringizni kiriting
          </p>
        </div>

        <form
          className="space-y-6"
          onSubmit={handleSubmit(onLoginSubmit)}
          noValidate
        >
          {/* --- THIS IS THE FIX: Using the new reusable component --- */}
          <PhoneNumberInput
            name="phone_number"
            label="Telefon raqam"
            control={control}
            error={errors.phone_number}
          />

          <div className="relative">
            <Input
              id="password"
              label="Parol"
              type={showPassword ? "text" : "password"}
              {...control.register("password")}
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:bg-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Parolni unutdingizmi?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-blue-700 dark:hover:bg-gray-700 transition"
          >
            KIRISH
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
