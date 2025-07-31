import React, { useState, useRef, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X, Camera, Plus, Trash2, ChevronUp } from "lucide-react";
import {
  Disclosure,
  Transition,
  DisclosurePanel,
  DisclosureButton,
} from "@headlessui/react";
import Select from "react-select";
import { Link } from "react-router-dom";
import clsx from "clsx";

// Import our custom UI components
import Input from "../ui/Input";
import PhoneNumberInput from "../ui/PhoneNumberInput";
import DateInput from "../ui/DateInput";
import Portal from "../ui/Portal";

// --- THE DEFINITIVE VALIDATION SCHEMA ---
const schema = yup.object().shape({
  full_name: yup.string().required("Ism-familiya majburiy"),
  phone_number: yup
    .string()
    .transform((v) => v.replace(/[^\d]/g, ""))
    .length(9, "Raqam to'liq kiritilishi kerak")
    .required("Telefon raqam majburiy"),
  birth_date: yup
    .date()
    .nullable()
    .transform((v) => (v instanceof Date && !isNaN(v) ? v : null)),
  gender: yup.string().required("Jinsini tanlang"),
  comment: yup.string(),
  profile_photo: yup.mixed().optional(),

  groups: yup.array().of(
    yup.object().shape({
      group: yup
        .object()
        .shape({
          value: yup.string().required(),
          label: yup.string().required(),
        })
        .required("Guruh tanlanishi shart")
        .nullable(),
      joined_at: yup.date().required(),
      price: yup
        .number()
        .min(0, "Narx manfiy bo'lishi mumkin emas")
        .transform((v) => (isNaN(v) ? undefined : v))
        .nullable(),
    })
  ),

  parents: yup.array().of(
    yup.object().shape({
      full_name: yup.string().required("Ota-ona ismi majburiy"),
      phone_number: yup
        .string()
        .transform((v) => v.replace(/[^\d]/g, ""))
        .length(9)
        .required("Ota-ona raqami majburiy"),
      gender: yup.string().required(),
      comment: yup.string(),
    })
  ),
});

// A custom component for the searchable Group dropdown with a "+ Yangi" button
const GroupSelect = ({ control, name, options, error }) => (
  <div className="space-y-1">
    <label className="text-xs text-gray-500">Guruhni qidirish</label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select {...field} options={options} placeholder="..." />
      )}
    />
    <div className="flex justify-end">
      <Link
        to="/groups"
        target="_blank"
        className="text-sm text-blue-600 hover:underline flex items-center"
      >
        <Plus size={14} className="mr-1" /> Yangi guruh
      </Link>
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
  </div>
);

const AddStudentModal = ({
  isOpen,
  onClose,
  refreshStudents,
  selectedBranchId,
}) => {
  const [photoPreview, setPhotoPreview] = useState(null);
  const photoInputRef = useRef(null);
  const [groupsForSelect, setGroupsForSelect] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { gender: "male", groups: [], parents: [] },
  });

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({ control, name: "groups" });
  const {
    fields: parentFields,
    append: appendParent,
    remove: removeParent,
  } = useFieldArray({ control, name: "parents" });

  useEffect(() => {
    if (isOpen) {
      api.get("/core/groups/").then((res) => {
        setGroupsForSelect(
          res.data.map((g) => ({
            value: g.id,
            label: `${g.name} (${g.teacher_name})`,
          }))
        );
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    reset();
    setPhotoPreview(null);
    onClose();
  };

  const onSubmit = async (data) => {
    const formData = new FormData();

    // --- Prepare data for the nested serializer ---
    if (!selectedBranchId) {
      toast.error("Iltimos, avval filialni tanlang!");
      return;
    }
    formData.append("branch", selectedBranchId);

    // Append basic student fields
    formData.append("full_name", data.full_name);
    formData.append("phone_number", `998${data.phone_number}`);
    formData.append("gender", data.gender);
    if (data.birth_date)
      formData.append(
        "birth_date",
        data.birth_date.toISOString().split("T")[0]
      );
    if (data.comment) formData.append("comment", data.comment);
    if (data.profile_photo && data.profile_photo.length > 0) {
      formData.append("profile_photo", data.profile_photo[0]);
    }

    // Append nested groups
    data.groups.forEach((group, index) => {
      formData.append(`groups[${index}]group`, group.group.value);
      formData.append(
        `groups[${index}]joined_at`,
        group.joined_at.toISOString().split("T")[0]
      );
      if (group.price) formData.append(`groups[${index}]price`, group.price);
    });

    // Append nested parents
    data.parents.forEach((parent, index) => {
      formData.append(`parents[${index}]full_name`, parent.full_name);
      formData.append(
        `parents[${index}]phone_number`,
        `998${parent.phone_number}`
      );
      formData.append(`parents[${index}]gender`, parent.gender);
      if (parent.comment)
        formData.append(`parents[${index}]comment`, parent.comment);
    });

    const toastId = toast.loading("O'quvchi qo'shilmoqda...");
    try {
      await api.post("/core/students/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Muvaffaqiyatli qo'shildi", { id: toastId });
      refreshStudents();
      handleClose();
    } catch (error) {
      toast.error("Xatolik yuz berdi", { id: toastId });
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-bold">Yangi o'quvchi qo'shish</h2>
            <button onClick={handleClose}>
              <X />
            </button>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-4 overflow-y-auto"
          >
            {/* --- STUDENT INFO SECTION (Styled like AddTeacherModal) --- */}
            <div className="flex justify-center">
              <input
                type="file"
                {...register("profile_photo")}
                ref={photoInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) =>
                  setPhotoPreview(URL.createObjectURL(e.target.files[0]))
                }
              />
              <button
                type="button"
                onClick={() => photoInputRef.current.click()}
                className="w-28 h-28 bg-blue-50 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-200 dark:border-gray-600 hover:border-blue-400 transition"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Camera size={40} className="text-blue-400" />
                )}
              </button>
            </div>

            <Input
              id="full_name"
              label="Ism familiya"
              {...register("full_name")}
              error={errors.full_name}
            />
            <PhoneNumberInput
              name="phone_number"
              label="Telefon raqam"
              control={control}
              error={errors.phone_number}
            />
            <DateInput
              name="birth_date"
              label="Tug'ilgan sana"
              control={control}
              error={errors.birth_date}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Jinsini tanlang
              </label>
              <div className="flex items-center space-x-6 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    {...register("gender")}
                    value="male"
                    className="h-4 w-4"
                  />{" "}
                  <span>Erkak</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    {...register("gender")}
                    value="female"
                    className="h-4 w-4"
                  />{" "}
                  <span>Ayol</span>
                </label>
              </div>
            </div>
            <Input
              id="comment"
              label="Izoh (ixtiyoriy)"
              {...register("comment")}
              error={errors.comment}
            />

            {/* --- ADD TO GROUP ACCORDION (Fixed and Styled) --- */}
            <Disclosure as="div" className="space-y-3">
              {({ open }) => (
                <>
                  <DisclosureButton className="flex justify-between w-full p-3 font-medium text-left text-lg">
                    <span>Guruhga qo'shish</span>{" "}
                    <ChevronUp
                      className={clsx(
                        "transition-transform",
                        !open && "rotate-180"
                      )}
                    />
                  </DisclosureButton>
                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <DisclosurePanel className="space-y-4">
                      {groupFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-4 border dark:border-gray-700 rounded-lg space-y-4 relative"
                        >
                          <GroupSelect
                            name={`groups.${index}.group`}
                            control={control}
                            options={groupsForSelect}
                            error={errors.groups?.[index]?.group}
                          />
                          <DateInput
                            name={`groups.${index}.joined_at`}
                            label="Qo'shilgan sana"
                            control={control}
                            error={errors.groups?.[index]?.joined_at}
                          />
                          <Input
                            id={`groups.${index}.price`}
                            label="Maxsus narx"
                            type="number"
                            {...register(`groups.${index}.price`)}
                            error={errors.groups?.[index]?.price}
                          />
                          {groupFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeGroup(index)}
                              className="absolute top-2 right-2 p-1 text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          appendGroup({
                            group: null,
                            joined_at: new Date(),
                            price: "",
                          })
                        }
                        className="flex items-center text-blue-600 font-semibold text-sm pt-2"
                      >
                        <Plus size={16} className="mr-1" /> Guruh qo'shish
                      </button>
                    </DisclosurePanel>
                  </Transition>
                </>
              )}
            </Disclosure>

            {/* --- ADD PARENT ACCORDION (Fixed and Styled) --- */}
            <Disclosure as="div" className="space-y-3">
              {({ open }) => (
                <>
                  <DisclosureButton className="flex justify-between p-3 w-full font-medium text-left text-lg">
                    <span>Ota-ona qo'shish</span>{" "}
                    <ChevronUp
                      className={clsx(
                        "transition-transform",
                        !open && "rotate-180"
                      )}
                    />
                  </DisclosureButton>
                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <DisclosurePanel className="space-y-4">
                      {parentFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-4 border dark:border-gray-700 rounded-lg space-y-4 relative"
                        >
                          <Input
                            id={`parents.${index}.full_name`}
                            label="Ota-ona F.I.SH."
                            {...register(`parents.${index}.full_name`)}
                            error={errors.parents?.[index]?.full_name}
                          />
                          <PhoneNumberInput
                            name={`parents.${index}.phone_number`}
                            label="Telefon raqami"
                            control={control}
                            error={errors.parents?.[index]?.phone_number}
                          />
                          <div>
                            <label className="text-sm font-medium">Jinsi</label>
                            <div className="flex space-x-6 mt-2">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  {...register(`parents.${index}.gender`)}
                                  value="male"
                                />
                                <span>Erkak</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  {...register(`parents.${index}.gender`)}
                                  value="female"
                                />
                                <span>Ayol</span>
                              </label>
                            </div>
                          </div>
                          <Input
                            id={`parents.${index}.comment`}
                            label="Izoh (ixtiyoriy)"
                            {...register(`parents.${index}.comment`)}
                          />
                          {/* --- DELETE BUTTON POSITION FIX --- */}
                          <button
                            type="button"
                            onClick={() => removeParent(index)}
                            className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {/* --- RENAME FIX --- */}
                      <button
                        type="button"
                        onClick={() =>
                          appendParent({
                            full_name: "",
                            phone_number: "",
                            gender: "male",
                          })
                        }
                        className="flex items-center text-blue-600 font-semibold text-sm pt-2"
                      >
                        <Plus size={16} className="mr-1" /> Ota-ona qo'shish
                      </button>
                    </DisclosurePanel>
                  </Transition>
                </>
              )}
            </Disclosure>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="mr-3 px-5 py-2.5 border rounded-lg"
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
        </div>
      </div>
    </Portal>
  );
};

export default AddStudentModal;
