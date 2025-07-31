import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X, User, Camera, Eye, EyeOff } from "lucide-react";
import Input from "../ui/Input";
import PhoneNumberInput from "../ui/PhoneNumberInput";

// --- NEW SCHEMA FOR PHONE CHANGE ---
const phoneSchema = yup.object().shape({
  new_phone_number: yup
    .string()
    .transform((v) => v.replace(/[^\d]/g, ""))
    .length(9)
    .required("Yangi raqam majburiy"),
  current_password: yup.string().required("Joriy parol majburiy"),
});

// Validation schema for the profile update form
const profileSchema = yup.object().shape({
  full_name: yup.string().required("Ism-familiya kiritilishi shart"),
  // The profile_photo is a FileList, which is an object. yup.mixed() handles this.
  profile_photo: yup.mixed().optional(),
});

// Validation schema for the password change form
const passwordSchema = yup.object().shape({
  old_password: yup.string().required("Eski parol majburiy"),
  new_password: yup
    .string()
    .min(6, "Yangi parol kamida 6 belgidan iborat bo'lishi kerak")
    .required("Yangi parol majburiy"),
});

const ProfileSettingsModal = ({ isOpen, onClose }) => {
  // Get user data and the state update function from the Auth context
  const { user, updateUserState, logoutUser } = useAuth();

  // UI State
  const [photoPreview, setPhotoPreview] = useState(user.profile_photo || null);
  const photoInputRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // --- FORM INSTANCE FOR PROFILE UPDATE ---
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
    reset: resetProfile, // We need the reset function
    setValue: setProfileValue, // And the setValue function
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      full_name: user.full_name,
    },
  });

  // --- FORM INSTANCE FOR PASSWORD CHANGE ---
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPassword,
  } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  // --- FORM INSTANCE FOR PHONE NUMBER CHANGE ---
  const {
    control: controlPhone,
    register: registerPhone,
    handleSubmit: handleSubmitPhone,
    formState: { errors: phoneErrors, isSubmitting: isPhoneSubmitting },
    reset: resetPhone,
  } = useForm({
    resolver: yupResolver(phoneSchema),
  });

  // --- THIS IS A CRITICAL FIX ---
  // This effect runs when the modal opens to ensure the form is
  // populated with the most current user data from the context.
  useEffect(() => {
    if (isOpen) {
      resetProfile({ full_name: user.full_name });
      setPhotoPreview(user.profile_photo);
      resetPassword({ old_password: "", new_password: "" });
      resetPhone({ new_phone_number: "", current_password: "" });
    }
  }, [isOpen, user, resetProfile, resetPassword, resetPhone]);

  // Handler for when the user selects a new photo file
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Update the preview for the user to see
      setPhotoPreview(URL.createObjectURL(file));
      // Programmatically set the value in the form state
      setProfileValue("profile_photo", e.target.files);
    }
  };

  // --- THIS IS THE DEFINITIVE PROFILE SUBMIT FIX ---
  const onProfileSubmit = async (data) => {
    const formData = new FormData();

    // Append full_name if it has changed
    if (data.full_name !== user.full_name) {
      formData.append("full_name", data.full_name);
    }

    // IMPORTANT: Check if a new file was actually selected
    const photoFile = data.profile_photo?.[0];
    if (photoFile) {
      formData.append("profile_photo", photoFile);
    }

    // If nothing was changed, don't make an API call
    if (formData.entries().next().done) {
      toast.success("Hech qanday o'zgarish qilinmadi.");
      onClose();
      return;
    }

    const toastId = toast.loading("Profil yangilanmoqda...");
    try {
      const response = await api.patch("/users/profile/update/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update the global user state with the fresh data from the API
      updateUserState(response.data);

      toast.success("Profil muvaffaqiyatli yangilandi!", { id: toastId });
      onClose();
    } catch (error) {
      toast.error("Profilni yangilashda xatolik.", { id: toastId });
    }
  };

  const onPhoneSubmit = async (data) => {
    const payload = {
      current_password: data.current_password,
      new_phone_number: `998${data.new_phone_number.replace(/[^\d]/g, "")}`,
    };
    const toastId = toast.loading("Telefon raqami o'zgartirilmoqda...");
    try {
      const response = await api.post("/users/phone/change/", payload);
      toast.success(response.data.detail, { id: toastId, duration: 5000 });
      onClose();
      // Since the username has changed, the current JWT is invalid. Force logout.
      setTimeout(() => {
        logoutUser();
      }, 2000);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.current_password?.[0] ||
          "Xatolik yuz berdi",
        { id: toastId }
      );
    }
  };

  const onPasswordSubmit = async (data) => {
    const toastId = toast.loading("Parol o'zgartirilmoqda...");
    try {
      await api.post("/users/password/change/", data);
      toast.success("Parol muvaffaqiyatli o'zgartirildi.", { id: toastId });
      resetPassword(); // Clear password fields on success
    } catch (error) {
      toast.error(
        error.response?.data?.old_password?.[0] ||
          "Parolni o'zgartirishda xatolik.",
        { id: toastId }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Profile Sozlamalari
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto">
          {/* --- PROFILE UPDATE FORM --- */}
          <form
            onSubmit={handleSubmitProfile(onProfileSubmit)}
            className="space-y-4"
          >
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
              Shaxsiy ma'lumotlar
            </h3>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User size={60} className="text-gray-400" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => photoInputRef.current.click()}
                className="text-sm text-blue-600 hover:underline"
              >
                Rasmni o'zgartirish
              </button>
              <input
                type="file"
                {...registerProfile("profile_photo")}
                ref={photoInputRef}
                onChange={handlePhotoChange}
                className="hidden"
                accept="image/*"
              />
            </div>

            <Input
              id="full_name"
              label="F.I.SH."
              {...registerProfile("full_name")}
              error={profileErrors.full_name}
            />

            <button
              type="submit"
              disabled={isProfileSubmitting}
              className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
            >
              Saqlash
            </button>
          </form>

          {/* --- PHONE NUMBER CHANGE FORM (New) --- */}
          <form
            onSubmit={handleSubmitPhone(onPhoneSubmit)}
            className="space-y-4 pt-6 border-t dark:border-gray-700"
          >
            <h3 className="font-semibold text-lg">
              Telefon raqamni o'zgartirish
            </h3>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hozirgi raqamingiz: <strong>+{user.phone_number}</strong>
              </p>
            </div>
            <PhoneNumberInput
              name="new_phone_number"
              label="Yangi telefon raqam"
              control={controlPhone}
              error={phoneErrors.new_phone_number}
            />
            <div className="relative">
              <Input
                id="current_password_phone"
                label="Joriy parol"
                type={showPassword.current ? "text" : "password"}
                {...registerPhone("current_password")}
                error={phoneErrors.current_password}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((p) => ({ ...p, current: !p.current }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword.current ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isPhoneSubmitting}
              className="w-full p-3 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-green-700 transition"
            >
              Raqamni O'zgartirish
            </button>
          </form>

          {/* --- PASSWORD CHANGE FORM --- */}
          <form
            onSubmit={handleSubmitPassword(onPasswordSubmit)}
            className="space-y-4 pt-6 border-t dark:border-gray-700"
          >
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
              Parolni o'zgartirish
            </h3>
            <div className="relative">
              <Input
                id="old_password"
                label="Eski parol"
                type={showOldPassword ? "text" : "password"}
                {...registerPassword("old_password")}
                error={passwordErrors.old_password}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <Input
                id="new_password"
                label="Yangi parol"
                type={showNewPassword ? "text" : "password"}
                {...registerPassword("new_password")}
                error={passwordErrors.new_password}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isPasswordSubmitting}
              className="w-full p-3 bg-indigo-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-indigo-700 transition"
            >
              O'zgartirish
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
