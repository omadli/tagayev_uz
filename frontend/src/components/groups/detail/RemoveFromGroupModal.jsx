import React from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import Portal from '../../ui/Portal';
import DateInput from '../../ui/DateInput';

const schema = yup.object().shape({
    archived_at: yup.date().required("Sana kiritilishi shart"),
});

const RemoveFromGroupModal = ({ isOpen, onClose, refreshData, enrollment }) => {
    const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { archived_at: new Date() }
    });

    const onSubmit = async (data) => {
        const payload = {
            archived_at: data.archived_at.toISOString().split('T')[0]
        };
        const toastId = toast.loading("O'quvchi guruhdan chiqarilmoqda...");
        try {
            await api.patch(`/core/enrollments/${enrollment.id}/archive/`, payload);
            toast.success("Muvaffaqiyatli guruhdan chiqarildi", { id: toastId });
            refreshData();
            onClose();
        } catch (error) { toast.error("Xatolik yuz berdi", { id: toastId }); }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
                    <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
                         <h2 className="text-xl font-bold">Guruhdan chiqarish</h2>
                         <button onClick={onClose}><X/></button>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                         <p>{enrollment.student_full_name}</p>
                         <DateInput name="archived_at" label="Quyidagi sanadan chiqarish" control={control} error={errors.archived_at} />
                         <div className="flex justify-end pt-4 gap-3">
                             <button type="button" onClick={onClose}>Bekor qilish</button>
                             <button type="submit" disabled={isSubmitting}>Chiqarish</button>
                         </div>
                    </form>
                </div>
            </div>
        </Portal>
    );
};

export default RemoveFromGroupModal;
