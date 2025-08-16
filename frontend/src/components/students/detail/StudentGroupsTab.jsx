import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import {
  Tabs,
  Tab,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";

const StudentGroupsTab = ({ studentId }) => {
    const [enrollments, setEnrollments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showArchived, setShowArchived] = useState(false);

    const fetchEnrollments = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = { student_id: studentId, is_archived: showArchived };
            const response = await api.get('/core/student-enrollments/', { params });
            setEnrollments(response.data);
        } catch { toast.error("Guruhlarni yuklab bo'lmadi."); }
        finally { setIsLoading(false); }
    }, [studentId, showArchived]);

    useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

    if (isLoading) return <CircularProgress />;

    return (
        <div>
            <button onClick={() => setShowArchived(!showArchived)}>
                {showArchived ? "Aktiv guruhlarni ko'rish" : "Arxivdagi guruhlarni ko'rish"}
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {enrollments.map(en => (
                    <div key={en.id} className="p-4 border rounded-lg">
                        <p className="font-bold">{en.group_name}</p>
                        <p>O'qituvchi: {en.teacher_name}</p>
                        <p>Balans: {en.balance} so'm</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default StudentGroupsTab;